// frontend-next/src/lib/surga-kalpe.ts
// Gestionnaire Sama Xaalis (Kalpé) local & offline-first pour Surga

export type KalpeDirection = 'entree' | 'sortie' | 'neutre'
export type KalpeModePaiement = 'wave' | 'om' | 'cash' | 'virement'

export interface KalpeOperationLocal {
  id: string
  direction: KalpeDirection
  type: string
  montant: number
  categorie: string
  libelle: string
  tiers_nom?: string
  date_operation: string
  mode_paiement?: KalpeModePaiement
  created_at: string
}

export interface KalpeDetteLocal {
  id: string
  tiers_nom: string
  tiers_telephone?: string
  montant_initial: number
  montant_paye: number
  montant_restant: number
  direction: 'a_recevoir' | 'a_payer' // a_recevoir = créance, a_payer = dette
  date_pret: string
  date_echeance?: string
  statut: 'en_cours' | 'solde' | 'en_retard'
  note?: string
}

export interface KalpeObjectifLocal {
  id: string
  titre: string
  montant_cible: number
  montant_actuel: number
  categorie: string
  date_echeance?: string
  statut: 'en_cours' | 'atteint'
}

export interface KalpeSyntheseSurga {
  solde_disponible: number
  total_entrees_mois: number
  total_depenses_mois: number
  total_a_recevoir: number
  total_a_payer: number
  total_epargne: number
}

const STORAGE_KEYS = {
  OPERATIONS: 'surga_kalpe_operations',
  DETTES: 'surga_kalpe_dettes',
  OBJECTIFS: 'surga_kalpe_objectifs',
}

// Données démo réalistes pour un démarrage propre et inspirant
const OPERATIONS_INITIALES: KalpeOperationLocal[] = [
  {
    id: 'op-1',
    direction: 'entree',
    type: 'revenu',
    montant: 150000,
    categorie: 'Prestation / Salaire',
    libelle: 'Versement honoraire mission Dakar',
    mode_paiement: 'wave',
    date_operation: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  },
  {
    id: 'op-2',
    direction: 'sortie',
    type: 'depense',
    montant: 25000,
    categorie: 'Alimentation / Courses',
    libelle: 'Courses hebdomadaires marché Kermel',
    mode_paiement: 'cash',
    date_operation: new Date().toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
  },
  {
    id: 'op-3',
    direction: 'sortie',
    type: 'depense',
    montant: 10000,
    categorie: 'Énergie / Woyofal',
    libelle: 'Recharge compteur Woyofal',
    mode_paiement: 'om',
    date_operation: new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10),
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
]

const DETTES_INITIALES: KalpeDetteLocal[] = [
  {
    id: 'det-1',
    tiers_nom: 'Moussa Diop',
    tiers_telephone: '+221 77 412 34 56',
    montant_initial: 50000,
    montant_paye: 20000,
    montant_restant: 30000,
    direction: 'a_recevoir',
    date_pret: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    date_echeance: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    statut: 'en_cours',
    note: 'Avance travaux atelier',
  },
  {
    id: 'det-2',
    tiers_nom: 'Quincaillerie Almadies',
    tiers_telephone: '+221 78 123 45 67',
    montant_initial: 25000,
    montant_paye: 0,
    montant_restant: 25000,
    direction: 'a_payer',
    date_pret: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    date_echeance: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().slice(0, 10),
    statut: 'en_cours',
    note: 'Matériaux peinture',
  },
]

const OBJECTIFS_INITIAUX: KalpeObjectifLocal[] = [
  {
    id: 'obj-1',
    titre: 'Tabaski 2026',
    montant_cible: 200000,
    montant_actuel: 85000,
    categorie: 'Fête & Famille',
    statut: 'en_cours',
  },
  {
    id: 'obj-2',
    titre: 'Fonds d’urgence imprévus',
    montant_cible: 500000,
    montant_actuel: 210000,
    categorie: 'Épargne de sécurité',
    statut: 'en_cours',
  },
]

export function getKalpeOperations(): KalpeOperationLocal[] {
  if (typeof window === 'undefined') return OPERATIONS_INITIALES
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OPERATIONS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(OPERATIONS_INITIALES))
      return OPERATIONS_INITIALES
    }
    return JSON.parse(raw)
  } catch {
    return OPERATIONS_INITIALES
  }
}

export function saveKalpeOperation(op: Omit<KalpeOperationLocal, 'id' | 'created_at'>): KalpeOperationLocal {
  const ops = getKalpeOperations()
  const nouvelle: KalpeOperationLocal = {
    ...op,
    id: 'op-' + Date.now(),
    created_at: new Date().toISOString(),
  }
  const updated = [nouvelle, ...ops]
  try {
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(updated))
  } catch {}
  return nouvelle
}

export function deleteKalpeOperation(id: string): void {
  const ops = getKalpeOperations()
  const filtered = ops.filter((o) => o.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(filtered))
  } catch {}
}

export function getKalpeDettes(): KalpeDetteLocal[] {
  if (typeof window === 'undefined') return DETTES_INITIALES
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DETTES)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.DETTES, JSON.stringify(DETTES_INITIALES))
      return DETTES_INITIALES
    }
    return JSON.parse(raw)
  } catch {
    return DETTES_INITIALES
  }
}

export function saveKalpeDette(dette: Omit<KalpeDetteLocal, 'id' | 'montant_paye' | 'montant_restant' | 'statut'>): KalpeDetteLocal {
  const dettes = getKalpeDettes()
  const nouvelle: KalpeDetteLocal = {
    ...dette,
    id: 'det-' + Date.now(),
    montant_paye: 0,
    montant_restant: dette.montant_initial,
    statut: 'en_cours',
  }
  const updated = [nouvelle, ...dettes]
  try {
    localStorage.setItem(STORAGE_KEYS.DETTES, JSON.stringify(updated))
  } catch {}
  return nouvelle
}

export function rembourserKalpeDette(detteId: string, montantRembourse: number): void {
  const dettes = getKalpeDettes()
  const updated = dettes.map((d) => {
    if (d.id !== detteId) return d
    const paye = Math.min(d.montant_initial, d.montant_paye + montantRembourse)
    const restant = Math.max(0, d.montant_initial - paye)
    return {
      ...d,
      montant_paye: paye,
      montant_restant: restant,
      statut: (restant <= 0 ? 'solde' : 'en_cours') as 'solde' | 'en_cours',
    }
  })
  try {
    localStorage.setItem(STORAGE_KEYS.DETTES, JSON.stringify(updated))
  } catch {}
}

export function deleteKalpeDette(id: string): void {
  const dettes = getKalpeDettes()
  const filtered = dettes.filter((d) => d.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.DETTES, JSON.stringify(filtered))
  } catch {}
}

export function getKalpeObjectifs(): KalpeObjectifLocal[] {
  if (typeof window === 'undefined') return OBJECTIFS_INITIAUX
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OBJECTIFS)
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.OBJECTIFS, JSON.stringify(OBJECTIFS_INITIAUX))
      return OBJECTIFS_INITIAUX
    }
    return JSON.parse(raw)
  } catch {
    return OBJECTIFS_INITIAUX
  }
}

export function saveKalpeObjectif(obj: Omit<KalpeObjectifLocal, 'id' | 'montant_actuel' | 'statut'>): KalpeObjectifLocal {
  const objectifs = getKalpeObjectifs()
  const nouveau: KalpeObjectifLocal = {
    ...obj,
    id: 'obj-' + Date.now(),
    montant_actuel: 0,
    statut: 'en_cours',
  }
  const updated = [...objectifs, nouveau]
  try {
    localStorage.setItem(STORAGE_KEYS.OBJECTIFS, JSON.stringify(updated))
  } catch {}
  return nouveau
}

export function verserKalpeObjectif(objectifId: string, montant: number): void {
  const objectifs = getKalpeObjectifs()
  const updated = objectifs.map((o) => {
    if (o.id !== objectifId) return o
    const nouveauTotal = o.montant_actuel + montant
    return {
      ...o,
      montant_actuel: nouveauTotal,
      statut: (nouveauTotal >= o.montant_cible ? 'atteint' : 'en_cours') as 'atteint' | 'en_cours',
    }
  })
  try {
    localStorage.setItem(STORAGE_KEYS.OBJECTIFS, JSON.stringify(updated))
  } catch {}
}

export function deleteKalpeObjectif(id: string): void {
  const objectifs = getKalpeObjectifs()
  const filtered = objectifs.filter((o) => o.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.OBJECTIFS, JSON.stringify(filtered))
  } catch {}
}

export function calculerSyntheseKalpe(moisStr = new Date().toISOString().slice(0, 7)): KalpeSyntheseSurga {
  const ops = getKalpeOperations()
  const dettes = getKalpeDettes()
  const objectifs = getKalpeObjectifs()

  let entreesMois = 0
  let sortiesMois = 0
  let soldeGlobal = 0

  ops.forEach((op) => {
    if (op.direction === 'entree') {
      soldeGlobal += op.montant
      if (op.date_operation && op.date_operation.startsWith(moisStr)) {
        entreesMois += op.montant
      }
    } else if (op.direction === 'sortie') {
      soldeGlobal -= op.montant
      if (op.date_operation && op.date_operation.startsWith(moisStr)) {
        sortiesMois += op.montant
      }
    }
  })

  let aRecevoir = 0
  let aPayer = 0
  dettes.forEach((d) => {
    if (d.statut !== 'solde') {
      if (d.direction === 'a_recevoir') aRecevoir += d.montant_restant
      else aPayer += d.montant_restant
    }
  })

  let epargneTotale = 0
  objectifs.forEach((obj) => {
    epargneTotale += obj.montant_actuel
  })

  return {
    solde_disponible: soldeGlobal,
    total_entrees_mois: entreesMois,
    total_depenses_mois: sortiesMois,
    total_a_recevoir: aRecevoir,
    total_a_payer: aPayer,
    total_epargne: epargneTotale,
  }
}
