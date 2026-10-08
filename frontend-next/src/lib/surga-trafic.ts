// frontend-next/src/lib/surga-trafic.ts
// Trafic Surga : types et libellés partagés par la carte, la fenêtre de détail et la colonne de droite.
// D53 : un axe n'a de valeur que s'il vient d'une mesure ou d'un signalement daté ; sinon il est « indisponible ».

export type NiveauTrafic = 'fluide' | 'dense' | 'bouche' | 'indisponible'

export interface AxeTrafic {
  id: string
  nom: string
  origine: string
  destination: string
  type: string
  sens: string
  niveau: NiveauTrafic
  tempsEstimeMin: number | null
  tempsHabituelMin: number
  distanceKm: number
  pointsChauds: string[]
  cause: string | null
  incident?: string | null
  source?: 'tomtom_live' | 'signalement' | 'aucune'
  vitesseReelleKmH?: number | null
  vitesseNormaleKmH?: number | null
  signalementRecent?: { type: string; commentaire?: string; date: string } | null
  updatedAt?: string | null
}

export const axeRenseigne = (axe: AxeTrafic): boolean =>
  axe.niveau !== 'indisponible' || Boolean(axe.signalementRecent)

export function libelleNiveau(axe: Pick<AxeTrafic, 'niveau' | 'incident'>): string {
  if (axe.niveau === 'bouche') return 'Bouché'
  if (axe.niveau === 'dense') return 'Dense'
  if (axe.niveau === 'fluide') return 'Fluide'
  return axe.incident === 'travaux' ? 'Travaux' : 'Indisponible'
}

// « 14 h 05 », à l'heure de Dakar. Chaîne vide si la date manque ou n'est pas lisible.
export function heureCourte(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const hm = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Dakar' }).format(d)
  return hm.replace(':', ' h ')
}

// D'où vient la valeur affichée, et de quand elle date.
export function origineAxe(axe: Pick<AxeTrafic, 'source' | 'updatedAt'>): string {
  const heure = heureCourte(axe.updatedAt)
  if (axe.source === 'tomtom_live') return heure ? `Mesuré à ${heure}` : 'Mesuré'
  if (axe.source === 'signalement') return heure ? `Signalé par un usager à ${heure}` : 'Signalé par un usager'
  return ''
}

export const MESSAGE_TRAFIC_INDISPONIBLE =
  'Trafic indisponible pour le moment : aucune mesure ni signalement récent.'

export const CARTE_TRAFIC_EXTERNE = 'https://www.google.com/maps/@14.7300,-17.4480,13z/data=!5m1!1e1'
