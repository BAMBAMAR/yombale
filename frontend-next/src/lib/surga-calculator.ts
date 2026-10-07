// frontend-next/src/lib/surga-calculator.ts
// Moteur de calcul arithmétique déterministe pour Surga côté client (sans eval, 100% offline)

export interface CalculResultat {
  success: boolean
  resultat?: number
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

export function evaluerCalcul(expr: string): CalculResultat {
  const propre = normaliserExpression(expr)
  if (!propre) {
    return { success: false, erreur: 'Expression vide' }
  }

  if (!/^[0-9+\-*/().%]+$/.test(propre)) {
    return { success: false, erreur: 'Caractères non autorisés' }
  }

  try {
    let resolu = propre.replace(/(\d+(?:\.\d+)?)([+\-])(\d+(?:\.\d+)?)%/g, '($1$2($1*($3/100)))')
    resolu = resolu.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')

    let pos = 0

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
      const val = parseFloat(resolu.slice(debut, pos))
      if (Number.isNaN(val)) throw new Error('Nombre invalide')
      sauterEspaces()
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
          const second = terme()
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

    return {
      success: true,
      resultat: Math.round(res * 100) / 100,
      expressionNettoyee: propre,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur de calcul'
    return { success: false, erreur: message }
  }
}
