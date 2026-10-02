export interface Produit {
  id: string
  nom: string
  prix: number | null
  images?: string[]
  photo?: string
}

export interface Zone {
  id: string
  nom: string
  prix: number
}

export interface ClubVipData {
  palier: string
  badge: string
  reduction_livraison: number
  livraison_offerte: boolean
}

export interface PromoApplique {
  code: string
  reduction: number
}

export interface CommanderModalProps {
  boutiqueId: string
  produit: Produit
  whatsapp?: string | null
  nomBoutique?: string | null
  onClose: () => void
  noteInitiale?: string
}

export function fcfa(n: number): string {
  return (new Intl.NumberFormat('fr-FR').format(n) + ' FCFA').replace(/[\u202F\u00A0]/g, ' ')
}

export function helperLienWhatsapp(tel: string | null | undefined, message: string): string {
  if (!tel) return '#'
  const digits = tel.replace(/\D/g, '')
  const clean = digits.length === 9 ? '221' + digits : digits
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
}

export function getMontantDevise(montantXof: number, dev: 'EUR' | 'USD' | 'XOF'): string {
  if (dev === 'EUR') return (montantXof / 655.957).toFixed(2)
  if (dev === 'USD') return (montantXof / 600.0).toFixed(2)
  return montantXof.toString()
}

export const DEFAULT_ZONES: Zone[] = [
  { id: 'a_convenir', nom: 'Livraison, frais à convenir', prix: 0 },
  { id: 'retrait-boutique', nom: 'Retrait gratuit en boutique', prix: 0 },
]
