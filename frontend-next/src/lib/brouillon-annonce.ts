// AUD-219 : brouillon d'annonce conservé sur l'appareil (jamais envoyé au serveur). Les photos ne sont pas stockées :
// ce sont des fichiers, l'utilisateur les rajoute à la reprise. Le stockage est injectable pour les tests, et toute
// erreur (mode privé, quota, données corrompues) est silencieuse : le formulaire marche toujours sans brouillon.

export interface BrouillonAnnonce {
  slug: string
  car: Record<string, string>
  champs: Record<string, string>
  step: 2 | 3
}

interface Stockage {
  getItem(k: string): string | null
  setItem(k: string, v: string): void
  removeItem(k: string): void
}

const PREFIXE = 'nopalou_annonce_brouillon_v1:'

function stockageParDefaut(): Stockage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

const cle = (email: string) => PREFIXE + (email || 'anonyme').trim().toLowerCase()

function dictionnaireDeTextes(v: unknown): Record<string, string> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const sortie: Record<string, string> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val !== 'string') return null
    sortie[k] = val
  }
  return sortie
}

export function lireBrouillon(email: string, stockage: Stockage | null = stockageParDefaut()): BrouillonAnnonce | null {
  try {
    const brut = stockage?.getItem(cle(email))
    if (!brut) return null
    const o = JSON.parse(brut)
    const car = dictionnaireDeTextes(o?.car)
    const champs = dictionnaireDeTextes(o?.champs)
    if (typeof o?.slug !== 'string' || !o.slug || !car || !champs) return null
    return { slug: o.slug, car, champs, step: o.step === 3 ? 3 : 2 }
  } catch {
    return null
  }
}

export function ecrireBrouillon(email: string, b: BrouillonAnnonce, stockage: Stockage | null = stockageParDefaut()): void {
  try {
    stockage?.setItem(cle(email), JSON.stringify(b))
  } catch {
    /* stockage indisponible : le brouillon est simplement perdu */
  }
}

export function effacerBrouillon(email: string, stockage: Stockage | null = stockageParDefaut()): void {
  try {
    stockage?.removeItem(cle(email))
  } catch {
    /* rien à faire */
  }
}
