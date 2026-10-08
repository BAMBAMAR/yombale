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

// SRG-A1-030 / SRG-A2-014 (décision D37) : le portefeuille d'un nouveau visiteur est vide.
// Il s'ouvrait sur des opérations, des dettes et des objectifs d'exemple, qui entraient dans le solde et les totaux du mois.
const OPERATIONS_INITIALES: KalpeOperationLocal[] = []
const DETTES_INITIALES: KalpeDetteLocal[] = []
const OBJECTIFS_INITIAUX: KalpeObjectifLocal[] = []

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

function notifierKalpe(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('surga-kalpe-change'))
      window.dispatchEvent(new CustomEvent('surga-data-change'))
    } catch {}
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
    notifierKalpe()
  } catch {}
  return nouvelle
}

export function deleteKalpeOperation(id: string): void {
  const ops = getKalpeOperations()
  const filtered = ops.filter((o) => o.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(filtered))
    notifierKalpe()
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
    notifierKalpe()
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
    notifierKalpe()
  } catch {}
}

export function deleteKalpeDette(id: string): void {
  const dettes = getKalpeDettes()
  const filtered = dettes.filter((d) => d.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.DETTES, JSON.stringify(filtered))
    notifierKalpe()
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
    notifierKalpe()
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
    notifierKalpe()
  } catch {}
}

export function deleteKalpeObjectif(id: string): void {
  const objectifs = getKalpeObjectifs()
  const filtered = objectifs.filter((o) => o.id !== id)
  try {
    localStorage.setItem(STORAGE_KEYS.OBJECTIFS, JSON.stringify(filtered))
    notifierKalpe()
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

export function getSoldeKalpeFormate(): string {
  const synthese = calculerSyntheseKalpe()
  return `${(synthese?.solde_disponible || 0).toLocaleString('fr-FR')} FCFA`
}

