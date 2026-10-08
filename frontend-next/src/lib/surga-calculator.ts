// frontend-next/src/lib/surga-calculator.ts
// Moteur de calcul arithmétique déterministe pour Surga côté client (sans eval, 100% offline)

export interface CalculResultat {
  success: boolean
  resultat?: number
  // Au-delà de 2^53, un nombre n'est plus représenté à l'unité près : le résultat est une valeur approchée.
  approche?: boolean
  expressionNettoyee?: string
  erreur?: string
}

export function normaliserExpression(expr: string): string {
  if (!expr || typeof expr !== 'string') return ''
  return expr
    .replace(/×/g, '*')
    .replace(/x/gi, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/\s+/g, '')
}

export { formaterFCFA } from './surga-formatting'

// SRG-A2-007 : un résultat de calcul s'affiche avec ses décimales. Le format des montants arrondit à l'entier :
// 7 ÷ 2 s'affichait « 4 FCFA ».
export function formaterNombreCalcul(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
}

// Montant calculé à reprendre dans la saisie d'une dépense, quand la calculatrice est ouverte hors du portefeuille.
const CLE_MONTANT_CALCULE = 'surga_montant_calcule'
export function deposerMontantCalcule(montant: number): void {
  try { sessionStorage.setItem(CLE_MONTANT_CALCULE, String(Math.round(montant))) } catch { /* stockage indisponible */ }
}
export function reprendreMontantCalcule(): number | null {
  try {
    const brut = sessionStorage.getItem(CLE_MONTANT_CALCULE)
    if (brut === null) return null
    sessionStorage.removeItem(CLE_MONTANT_CALCULE)
    const montant = parseInt(brut, 10)
    return Number.isFinite(montant) && montant > 0 ? montant : null
  } catch {
    return null
  }
}

export function evaluerCalcul(expr: string): CalculResultat {
  const propre = normaliserExpression(expr)
  if (!propre) {
    return { success: false, erreur: 'Expression vide' }
  }

  if (!/^[0-9+\-*/().%]+$/.test(propre)) {
    return { success: false, erreur: 'Caractères non autorisés' }
  }

  try {
    const resolu = propre
    let pos = 0
    // Vrai quand le dernier terme lu est un pourcentage seul (« 10% ») : ajouté ou retiré, il porte sur tout ce
    // qui précède. « 100+50+10% » vaut 165 ; l'ancienne réécriture l'appliquait au seul dernier nombre (155).
    let pourcentSeul = false
    let approche = false

    function sauterEspaces(): void {
      while (pos < resolu.length && resolu[pos] === ' ') pos++
    }

    function lireNombre(): number {
      sauterEspaces()
      const debut = pos
      if (resolu[pos] === '-' || resolu[pos] === '+') pos++
      while (pos < resolu.length && /[0-9.]/.test(resolu[pos])) {
        pos++
      }
      // Un nombre s'écrit avec un seul séparateur décimal : « 1.2.3 » était lu 1,2.
      const ecrit = resolu.slice(debut, pos)
      if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(ecrit)) throw new Error('Nombre invalide')
      const val = parseFloat(ecrit)
      if (Math.abs(val) > Number.MAX_SAFE_INTEGER) approche = true
      sauterEspaces()
      if (resolu[pos] === '%') {
        pos++
        pourcentSeul = true
        return val / 100
      }
      return val
    }

    function facteur(): number {
      sauterEspaces()
      if (pos >= resolu.length) throw new Error('Fin inattendue')
      if (resolu[pos] === '(') {
        pos++
        const val = exprParser()
        sauterEspaces()
        if (resolu[pos] !== ')') throw new Error('Parenthèse fermante manquante')
        pos++
        sauterEspaces()
        return val
      }
      return lireNombre()
    }

    function terme(): number {
      sauterEspaces()
      let val = facteur()
      while (pos < resolu.length) {
        sauterEspaces()
        const op = resolu[pos]
        if (op === '*' || op === '/') {
          pos++
          const second = facteur()
          pourcentSeul = false
          if (op === '/') {
            if (second === 0) throw new Error('Division par zéro')
            val = val / second
          } else {
            val = val * second
          }
        } else {
          break
        }
      }
      return val
    }

    function exprParser(): number {
      sauterEspaces()
      let val = terme()
      while (pos < resolu.length) {
        sauterEspaces()
        const op = resolu[pos]
        if (op === '+' || op === '-') {
          pos++
          pourcentSeul = false
          const lu = terme()
          const second = pourcentSeul ? val * lu : lu
          pourcentSeul = false
          val = op === '+' ? val + second : val - second
        } else {
          break
        }
      }
      return val
    }

    const res = exprParser()
    sauterEspaces()
    if (pos < resolu.length) {
      throw new Error('Caractères résiduels')
    }

    if (!Number.isFinite(res)) {
      return { success: false, erreur: 'Résultat indéterminé' }
    }

    if (Math.abs(res) > Number.MAX_SAFE_INTEGER) approche = true

    return {
      success: true,
      resultat: Math.round(res * 100) / 100,
      ...(approche ? { approche: true } : {}),
      expressionNettoyee: propre,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur de calcul'
    return { success: false, erreur: message }
  }
}
