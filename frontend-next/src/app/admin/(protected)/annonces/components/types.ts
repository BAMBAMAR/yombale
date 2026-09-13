export interface Annonce {
  id: string
  titre: string
  description: string | null
  categorie_slug: string
  prix: number | null
  ville: string | null
  actif: boolean
  payee: boolean
  rejete: boolean
  boost_until?: string | null
  auteur_nom: string | null
  auteur_email: string | null
  contact_tel: string
  photos: string[]
  created_at: string
}

export type TabStatus = 'toutes' | 'attente' | 'actives' | 'boostees' | 'rejetees'
export type TriOption = 'recent' | 'ancien' | 'prix_asc' | 'prix_desc'

export const CATEGORIES_LABELS: Record<string, string> = {
  smartphones: 'Smartphones & Tablettes',
  informatique: 'Informatique & Laptops',
  'tv-electro': 'TV & Électroménager',
  mode: 'Mode & Vêtements',
  maison: 'Maison & Déco',
  'auto-moto': 'Auto & Moto',
  jeux: 'Jeux vidéo & Consoles',
  services: 'Services & Prestations',
  immo: 'Immobilier',
  beaute: 'Beauté & Cosmétiques',
  emploi: 'Emploi & Recrutement',
  divers: 'Divers',
}

export const VILLES_POPULAIRES = [
  'Dakar',
  'Thiès',
  'Saint-Louis',
  'Rufisque',
  'Ziguinchor',
  'Mbour',
  'Kaolack',
  'Touba',
  'Louga',
  'Diourbel',
]

export function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-SN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatPrix(p: number | null) {
  if (!p) return null
  return new Intl.NumberFormat('fr-SN').format(p) + ' FCFA'
}

export function statutClass(annonce: Annonce) {
  if (annonce.rejete) return 'admin-annonce-row--rejete'
  if (annonce.actif) return 'admin-annonce-row--active'
  return 'admin-annonce-row--attente'
}
