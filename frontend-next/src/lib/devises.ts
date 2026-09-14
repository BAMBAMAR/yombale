/**
 * Nopalou Multi-Devises Indicatif (Afrique de l'Ouest & International)
 * Devise de référence et de règlement légal : FCFA (XOF - BCEAO)
 * Taux officiels et indicatifs pour la diaspora et le commerce sous-régional.
 */

export type CodeDevise = 'XOF' | 'EUR' | 'USD' | 'GNF' | 'NGN'

export interface InfoDevise {
  code: CodeDevise
  nom: string
  symbole: string
  drapeau: string
  tauxParFcfa: number // Combien d'unités de cette devise pour 1 FCFA
  tauxFixe?: boolean
  pays: string
}

export const DEVISES_REGIONALES: Record<CodeDevise, InfoDevise> = {
  XOF: {
    code: 'XOF',
    nom: 'Franc CFA (UEMOA)',
    symbole: 'FCFA',
    drapeau: '🇸🇳',
    tauxParFcfa: 1,
    tauxFixe: true,
    pays: 'Sénégal, Côte d\'Ivoire, Mali, etc.',
  },
  EUR: {
    code: 'EUR',
    nom: 'Euro',
    symbole: '€',
    drapeau: '🇪🇺',
    tauxParFcfa: 1 / 655.957, // Parité fixe officielle BCEAO / Trésor français
    tauxFixe: true,
    pays: 'Diaspora Europe / Zone Euro',
  },
  USD: {
    code: 'USD',
    nom: 'Dollar Américain',
    symbole: '$',
    drapeau: '🇺🇸',
    tauxParFcfa: 1 / 605, // Taux indicatif moyen
    tauxFixe: false,
    pays: 'Diaspora USA, Canada, International',
  },
  GNF: {
    code: 'GNF',
    nom: 'Franc Guinéen',
    symbole: 'GNF',
    drapeau: '🇬🇳',
    tauxParFcfa: 14.25, // Taux indicatif transfrontalier
    tauxFixe: false,
    pays: 'Guinée-Conakry',
  },
  NGN: {
    code: 'NGN',
    nom: 'Naira Nigérian',
    symbole: '₦',
    drapeau: '🇳🇬',
    tauxParFcfa: 2.45, // Taux indicatif transfrontalier
    tauxFixe: false,
    pays: 'Nigeria',
  },
}

/**
 * Convertit un montant exprimé en FCFA vers une devise cible.
 */
export function convertirDepuisFcfa(montantFcfa: number, deviseCible: CodeDevise): number {
  if (!montantFcfa || isNaN(montantFcfa) || montantFcfa <= 0) return 0
  const info = DEVISES_REGIONALES[deviseCible]
  if (!info) return montantFcfa
  return montantFcfa * info.tauxParFcfa
}

/**
 * Formate un montant converti avec symbole et séparateurs de milliers.
 */
export function formaterMontantDevise(
  montantFcfa: number,
  deviseCible: CodeDevise,
  locale: string = 'fr-FR'
): string {
  if (deviseCible === 'XOF') {
    const arrondi = Math.round(montantFcfa || 0)
    return `${arrondi.toLocaleString(locale)} FCFA`
  }

  const converti = convertirDepuisFcfa(montantFcfa, deviseCible)
  const info = DEVISES_REGIONALES[deviseCible]

  if (deviseCible === 'EUR') {
    return `${converti.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
  }

  if (deviseCible === 'USD') {
    return `$${converti.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (deviseCible === 'GNF') {
    const arrondi = Math.round(converti)
    return `${arrondi.toLocaleString(locale)} GNF`
  }

  if (deviseCible === 'NGN') {
    const arrondi = Math.round(converti)
    return `₦${arrondi.toLocaleString(locale)}`
  }

  return `${converti.toLocaleString(locale)} ${info.symbole}`
}

/**
 * Texte d'équivalence indicatif (ex: "~ 15,24 €" ou "~ $16.50")
 */
export function formatEquivalenceDevise(montantFcfa: number, deviseCible: CodeDevise): string {
  if (deviseCible === 'XOF') return ''
  return `≈ ${formaterMontantDevise(montantFcfa, deviseCible)}`
}
