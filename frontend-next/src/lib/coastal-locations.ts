// frontend-next/src/lib/coastal-locations.ts
// Référentiel des localités côtières et de couverture trafic du Sénégal (SRG-UI-01, SRG-UI-02).
// Facile à enrichir et maintenir sans toucher au code des composants.

export interface ZoneMaritimeConfig {
  id: string
  nom: string
  maritime: boolean
  spotMaree?: string
}

/**
 * Catalogue exhaustif des localités maritimes du Sénégal disposant d'un régime de marées.
 * Les villes de l'intérieur (Kaffrine, Kaolack, Thiès, Tambacounda, etc.) n'affichent jamais de marées.
 */
export const LOCALITES_COTIERES_SENEGAL: Record<string, ZoneMaritimeConfig> = {
  dakar: { id: 'dakar', nom: 'Dakar', maritime: true, spotMaree: 'Pointe des Almadies / Rade de Dakar' },
  'dakar-plateau': { id: 'dakar-plateau', nom: 'Dakar Plateau', maritime: true, spotMaree: 'Port Autonome de Dakar' },
  almadies: { id: 'almadies', nom: 'Almadies / Ngor', maritime: true, spotMaree: 'Pointe des Almadies' },
  ouakam: { id: 'ouakam', nom: 'Ouakam / Mamelles', maritime: true, spotMaree: 'Phare des Mamelles' },
  yoff: { id: 'yoff', nom: 'Yoff / Ouest-Foire', maritime: true, spotMaree: 'Baie de Yoff' },
  mermoz: { id: 'mermoz', nom: 'Mermoz / Sacré-Cœur', maritime: true, spotMaree: 'Corniche Ouest' },
  'parcelles-assainies': { id: 'parcelles-assainies', nom: 'Parcelles Assainies', maritime: true, spotMaree: 'Plage BCEAO' },
  pikine: { id: 'pikine', nom: 'Pikine', maritime: true, spotMaree: 'Baie de Hann' },
  guediawaye: { id: 'guediawaye', nom: 'Guédiawaye', maritime: true, spotMaree: 'Littoral Nord' },
  rufisque: { id: 'rufisque', nom: 'Rufisque', maritime: true, spotMaree: 'Rade de Rufisque' },
  mbour: { id: 'mbour', nom: 'Mbour / Saly', maritime: true, spotMaree: 'Petite-Côte' },
  'saint-louis': { id: 'saint-louis', nom: 'Saint-Louis', maritime: true, spotMaree: 'Embouchure Fleuve Sénégal / Hydrobase' },
  ziguinchor: { id: 'ziguinchor', nom: 'Ziguinchor', maritime: true, spotMaree: 'Fleuve Casamance / Estuaire' },
  'cap-skirring': { id: 'cap-skirring', nom: 'Cap Skirring', maritime: true, spotMaree: 'Océan Atlantique Sud' },
}

/**
 * Zones couvertes par le système de trafic en direct (SRG-UI-01)
 */
export const ZONES_TRAFIC_DAKAR = [
  'dakar',
  'dakar-plateau',
  'plateau',
  'almadies',
  'ngor',
  'ouakam',
  'mamelles',
  'yoff',
  'mermoz',
  'sacre-coeur',
  'parcelles',
  'grand-dakar',
  'colobane',
  'pikine',
  'guediawaye',
  'rufisque',
  'diamniadio',
  'fann',
  'point-e',
  'medina',
]

function normaliser(str: unknown): string {
  return (typeof str === 'string' ? str : '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\/\-_,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Vérifie si une localité possède une façade maritime (SRG-UI-02)
 */
export function estLocaliteMaritime(nomOuId: string): boolean {
  if (!nomOuId) return false
  const norm = normaliser(nomOuId)
  return Object.entries(LOCALITES_COTIERES_SENEGAL).some(([id, conf]) => {
    return (
      id === norm ||
      normaliser(conf.nom) === norm ||
      norm.includes(id) ||
      normaliser(conf.nom).includes(norm)
    )
  })
}

/**
 * Vérifie si la localité est couverte par le trafic en direct de Dakar (SRG-UI-01)
 */
export function estZoneCouverteParTrafic(nomOuId: string): boolean {
  if (!nomOuId) return true // Défaut Dakar
  const norm = normaliser(nomOuId)
  return ZONES_TRAFIC_DAKAR.some((zone) => norm.includes(zone) || zone.includes(norm))
}
