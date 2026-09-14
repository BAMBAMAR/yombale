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
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
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
  { id: 'dakar_centre', nom: 'Dakar Centre & Plateau (Médina, Plateau, Fann, Point E) — 1 000 FCFA', prix: 1000 },
  { id: 'dakar_residentiel', nom: 'Dakar Almadies & Ouest (Almadies, Ouakam, Mermoz, Yoff) — 1 500 FCFA', prix: 1500 },
  { id: 'dakar_peripherie', nom: 'Grand Dakar & Parcelles (HLM, Liberté, Maristes, Parcelles) — 1 800 FCFA', prix: 1800 },
  { id: 'banlieue_proche', nom: 'Banlieue Tiak-Tiak (Pikine, Guédiawaye, Keur Massar) — 2 200 FCFA', prix: 2200 },
  { id: 'grande_banlieue', nom: 'Grande Banlieue (Rufisque, Bargny, Diamniadio) — 3 000 FCFA', prix: 3000 },
  { id: 'regions_proches', nom: 'Petite Côte & Thiès (Thiès, Mbour, Saly) — 3 500 FCFA', prix: 3500 },
  { id: 'regions_eloignees', nom: 'Régions Intérieures (St-Louis, Touba, Kaolack, Ziguinchor) — 5 000 FCFA', prix: 5000 },
  { id: 'retrait-boutique', nom: 'Retrait gratuit en boutique', prix: 0 },
]
