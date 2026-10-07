// frontend-next/src/lib/surga-xaalis-security.ts
// Gestionnaire de confidentialité & sécurité par Code PIN pour Sama Xaalis (Surga)

const STORAGE_KEYS = {
  MASQUE: 'surga_xaalis_masque',
  PIN_HASH: 'surga_xaalis_pin_hash',
  SESSION_UNLOCKED: 'surga_xaalis_unlocked_session',
}

/**
 * Hachage simple et rapide côté client pour stocker le PIN sans le laisser en clair
 */
function hashPin(pin: string): string {
  let hash = 0
  const sel = 'surga_xaalis_sel_2026_' + pin
  for (let i = 0; i < sel.length; i++) {
    const char = sel.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0 // Conversion en entier 32 bits
  }
  return 'pin_' + Math.abs(hash).toString(16)
}

/**
 * Notifie tous les composants de l'application d'un changement de confidentialité
 */
export function notifierChangementSecurite(): void {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('surga-xaalis-privacy-change'))
    } catch {}
  }
}

/**
 * Vérifie si les montants de Sama Xaalis doivent être masqués (•••••• FCFA)
 */
export function isXaalisMasque(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const val = localStorage.getItem(STORAGE_KEYS.MASQUE)
    return val === 'true'
  } catch {
    return false
  }
}

/**
 * Modifie l'état de masquage
 */
export function setXaalisMasque(masque: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEYS.MASQUE, masque ? 'true' : 'false')
    notifierChangementSecurite()
  } catch {}
}

/**
 * Bascule l'état de masquage entre affiché et masqué
 */
export function toggleXaalisMasque(): boolean {
  const actuel = isXaalisMasque()
  const nouveau = !actuel
  setXaalisMasque(nouveau)
  return nouveau
}

/**
 * Indique si un Code PIN de protection est configuré
 */
export function hasXaalisPin(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const hash = localStorage.getItem(STORAGE_KEYS.PIN_HASH)
    return Boolean(hash && hash.startsWith('pin_'))
  } catch {
    return false
  }
}

/**
 * Vérifie si la session actuelle est déverrouillée
 */
export function isXaalisSessionDeverrouillee(): boolean {
  if (typeof window === 'undefined') return true
  if (!hasXaalisPin()) return true
  try {
    return sessionStorage.getItem(STORAGE_KEYS.SESSION_UNLOCKED) === 'true'
  } catch {
    return false
  }
}

/**
 * Indique si Sama Xaalis est actuellement verrouillé par Code PIN
 */
export function isXaalisVerrouille(): boolean {
  if (!hasXaalisPin()) return false
  return !isXaalisSessionDeverrouillee()
}

/**
 * Vérifie si un code PIN soumis correspond au PIN enregistré
 */
export function verifierXaalisPin(pinSaisi: string): boolean {
  if (typeof window === 'undefined') return false
  try {
    const hashStocke = localStorage.getItem(STORAGE_KEYS.PIN_HASH)
    if (!hashStocke) return false
    return hashStocke === hashPin(pinSaisi.trim())
  } catch {
    return false
  }
}

/**
 * Enregistre un nouveau code PIN (4 chiffres) et déverrouille la session
 */
export function definirXaalisPin(nouveauPin: string): boolean {
  if (typeof window === 'undefined') return false
  const propre = nouveauPin.trim()
  if (!/^\d{4}$/.test(propre)) return false
  try {
    localStorage.setItem(STORAGE_KEYS.PIN_HASH, hashPin(propre))
    sessionStorage.setItem(STORAGE_KEYS.SESSION_UNLOCKED, 'true')
    notifierChangementSecurite()
    return true
  } catch {
    return false
  }
}

/**
 * Supprime le code PIN après vérification
 */
export function supprimerXaalisPin(pinActuel: string): boolean {
  if (typeof window === 'undefined') return false
  if (!verifierXaalisPin(pinActuel)) return false
  try {
    localStorage.removeItem(STORAGE_KEYS.PIN_HASH)
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_UNLOCKED)
    notifierChangementSecurite()
    return true
  } catch {
    return false
  }
}

/**
 * Déverrouille la session après saisie du bon PIN
 */
export function deverrouillerXaalisSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEYS.SESSION_UNLOCKED, 'true')
    notifierChangementSecurite()
  } catch {}
}

/**
 * Reverrouille immédiatement la session et active le masquage pour confidentialité maximale
 */
export function verrouillerXaalisSession(): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_UNLOCKED)
    setXaalisMasque(true)
    notifierChangementSecurite()
  } catch {}
}

/**
 * Formate un montant en masquant sa valeur si la confidentialité est activée
 */
export function formaterMontantConfidentiel(
  valeur: number | string,
  masque = false,
  suffixe = 'FCFA'
): string {
  if (masque) {
    return `•••••• ${suffixe}`.trim()
  }
  if (typeof valeur === 'number') {
    return `${valeur.toLocaleString('fr-FR')} ${suffixe}`.trim()
  }
  return `${valeur} ${suffixe}`.trim()
}
