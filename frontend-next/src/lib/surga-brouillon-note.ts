// SRG-A3-007 : brouillon de la note en cours d'écriture. Gardé sur l'appareil à chaque frappe, il survit à un
// rechargement, à un changement d'onglet et au bouton retour ; il est effacé à l'enregistrement de la note.
// Une seule place : le brouillon le plus récent remplace le précédent.
// La clé porte le préfixe « surga_offline_ » : elle suit les autres données du compte à la déconnexion.
import type { SurgaChecklistItem, SurgaNoteCategorie, SurgaNoteCouleur } from './surga-offline-sync'

const CLE = 'surga_offline_brouillon_note'

export interface BrouillonNote {
  // Identifiant de la note modifiée, ou null pour une nouvelle note.
  id: string | null
  titre: string
  contenu: string
  categorie: SurgaNoteCategorie
  couleur: SurgaNoteCouleur
  epingle: boolean
  is_checklist: boolean
  checklist: SurgaChecklistItem[]
  le: string
}

export function lireBrouillonNote(): BrouillonNote | null {
  try {
    const b = JSON.parse(localStorage.getItem(CLE) || 'null')
    if (!b || typeof b !== 'object' || typeof b.titre !== 'string' || typeof b.contenu !== 'string') return null
    return { ...b, id: typeof b.id === 'string' ? b.id : null, checklist: Array.isArray(b.checklist) ? b.checklist : [] }
  } catch {
    return null
  }
}

export function effacerBrouillonNote(): void {
  try { localStorage.removeItem(CLE) } catch { /* stockage indisponible : rien à effacer */ }
}

// Un brouillon sans titre, sans texte et sans élément de liste n'est pas gardé.
export function garderBrouillonNote(b: Omit<BrouillonNote, 'le'>): void {
  if (!b.titre.trim() && !b.contenu.trim() && b.checklist.length === 0) { effacerBrouillonNote(); return }
  try { localStorage.setItem(CLE, JSON.stringify({ ...b, le: new Date().toISOString() })) } catch { /* stockage plein ou indisponible */ }
}
