// frontend-next/src/lib/logistique-senegal.ts
// Module Logistique Locale & Calculateur Tiak-Tiak Sénégal (Audit 94+/100)

export interface ZoneLivraison {
  id: string
  nom: string
  communes: string[]
  tarifBase: number
  delaiEstime: string
  typeTransport: 'moto_tiak_tiak' | 'camionnette' | 'gp_interurbain'
}

export const ZONES_LIVRAISON_SENEGAL: ZoneLivraison[] = [
  {
    id: 'dakar_centre',
    nom: 'Dakar Centre & Plateau',
    communes: ['Plateau', 'Médina', 'Fann', 'Point E', 'Gueule Tapée', 'Colobane', 'Fass'],
    tarifBase: 1000,
    delaiEstime: '1h - 2h (Express Moto)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'dakar_residentiel',
    nom: 'Dakar Résidentiel & Almadies',
    communes: ['Almadies', 'Ngor', 'Ouakam', 'Mamelles', 'Yoff', 'Mermoz', 'Sacré-Cœur', 'Sotrac Mermoz'],
    tarifBase: 1500,
    delaiEstime: '1h - 3h (Express Moto)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'dakar_peripherie',
    nom: 'Grand Dakar & Parcelles',
    communes: ['Grand Dakar', 'Liberté 1-6', 'HLM', 'Dieuppeul', 'Castors', 'Parcelles Assainies', 'Grand Yoff', 'Patte d’Oie', 'Maristes', 'Hann Bel-Air'],
    tarifBase: 1800,
    delaiEstime: '2h - 3h (Express Moto)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'banlieue_proche',
    nom: 'Banlieue Proche Dakar',
    communes: ['Pikine', 'Guédiawaye', 'Thiaroye', 'Yeumbeul', 'Malika', 'Keur Massar'],
    tarifBase: 2200,
    delaiEstime: '2h - 4h (Express Tiak-Tiak)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'grande_banlieue',
    nom: 'Grande Banlieue & Rufisque',
    communes: ['Rufisque', 'Bargny', 'Sébikotane', 'Diamniadio', 'Sangalkam', 'Lac Rose'],
    tarifBase: 3000,
    delaiEstime: '3h - 5h (Moto / Relais)',
    typeTransport: 'moto_tiak_tiak'
  },
  {
    id: 'regions_proches',
    nom: 'Petite Côte & Thiès',
    communes: ['Thiès', 'Mbour', 'Saly', 'Somone', 'Popenguine', 'Ngaparou', 'Joal'],
    tarifBase: 3500,
    delaiEstime: '24h (Allo Dakar / GP)',
    typeTransport: 'gp_interurbain'
  },
  {
    id: 'regions_eloignees',
    nom: 'Régions Intérieures & Sud',
    communes: ['Saint-Louis', 'Touba', 'Kaolack', 'Ziguinchor', 'Kolda', 'Tambacounda', 'Fatick', 'Kédougou'],
    tarifBase: 5000,
    delaiEstime: '24h - 48h (Colis Poste / GP)',
    typeTransport: 'gp_interurbain'
  }
]

/**
 * Liste aplatie de toutes les communes sénégalaises supportées pour l'autocomplétion
 */
export const COMMUNES_LISTE = ZONES_LIVRAISON_SENEGAL.flatMap(z => z.communes)

/**
 * Calcule les frais de livraison d'une commune
 * @param nomCommune - Nom saisi ou sélectionné par l'acheteur
 * @param options - Options (seuil de gratuité boutique, etc.)
 */
export function estimerFraisLivraison(
  nomCommune: string,
  options?: { seuilGratuite?: number; sousTotal?: number }
): {
  montant: number
  delai: string
  zoneNom: string
  estGratuit: boolean
  economie: number
} {
  const clean = (nomCommune || '').trim().toLowerCase()
  
  // Chercher la zone correspondante
  let zoneTrouvee = ZONES_LIVRAISON_SENEGAL.find(z =>
    z.communes.some(c => c.toLowerCase() === clean || clean.includes(c.toLowerCase()))
  )

  // Valeur par défaut : Dakar standard
  if (!zoneTrouvee) {
    zoneTrouvee = ZONES_LIVRAISON_SENEGAL[2] // Grand Dakar
  }

  const tarifNormal = zoneTrouvee.tarifBase

  // Vérifier si le seuil de livraison offerte est atteint
  if (
    options?.seuilGratuite &&
    options?.sousTotal &&
    options.sousTotal >= options.seuilGratuite
  ) {
    return {
      montant: 0,
      delai: zoneTrouvee.delaiEstime,
      zoneNom: zoneTrouvee.nom,
      estGratuit: true,
      economie: tarifNormal
    }
  }

  return {
    montant: tarifNormal,
    delai: zoneTrouvee.delaiEstime,
    zoneNom: zoneTrouvee.nom,
    estGratuit: false,
    economie: 0
  }
}
