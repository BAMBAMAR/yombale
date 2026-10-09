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
  source?: 'google_maps' | 'signalement' | 'aucune'
  vitesseReelleKmH?: number | null
  vitesseNormaleKmH?: number | null
  // Par où passe le trajet mesuré, tel que le fournisseur le nomme.
  itineraire?: string | null
  signalementRecent?: { type: string; commentaire?: string; date: string } | null
  updatedAt?: string | null
}

export interface AlertePresseTrafic {
  titre: string
  source: string
  url: string
  publie_le: string
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
  // Le nom du fournisseur s'écrit tel quel : il demande à être cité, sans traduction ni modification.
  if (axe.source === 'google_maps') return heure ? `Mesuré à ${heure} · Google Maps` : 'Mesuré · Google Maps'
  if (axe.source === 'signalement') return heure ? `Signalé par un usager à ${heure}` : 'Signalé par un usager'
  return ''
}

export const MESSAGE_TRAFIC_INDISPONIBLE =
  'Trafic indisponible pour le moment : aucune mesure ni signalement récent.'

export const CARTE_TRAFIC_EXTERNE = 'https://www.google.com/maps/@14.7300,-17.4480,13z/data=!5m1!1e1'

// Lien d'itinéraire de Google Maps (gratuit, sans clé) : ouvre l'application sur un téléphone, le site sinon.
// Sans départ, Google part de la position de l'appareil. Un lieu saisi sans ville est cherché au Sénégal.
const auSenegal = (lieu: string): string => (/,|sénégal|senegal/i.test(lieu) ? lieu : `${lieu}, Sénégal`)
export function lienItineraire(depart: string, arrivee: string): string {
  const p = new URLSearchParams({ api: '1', destination: auSenegal(arrivee.trim()), travelmode: 'driving' })
  if (depart.trim()) p.set('origin', auSenegal(depart.trim()))
  return `https://www.google.com/maps/dir/?${p.toString()}`
}
