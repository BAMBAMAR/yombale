/**
 * Helper Fast Tender — Calcul dynamique des suggestions de billets d'encaissement en FCFA
 * Permet au caissier d'encaisser en 1 seul clic selon les coupures de billets d'Afrique de l'Ouest (BCEAO).
 * Coupures standard : 500, 1 000, 2 000, 5 000, 10 000, 20 000 FCFA.
 */

export interface FastTenderOption {
  montant: number
  label: string
  monnaieARendre: number
  isExact?: boolean
}

export function calculerSuggestionsFastTender(totalNet: number): FastTenderOption[] {
  if (!totalNet || totalNet <= 0) return []

  const COUPURES = [500, 1000, 2000, 5000, 10000, 20000]
  const options: FastTenderOption[] = []

  // 1. Toujours proposer le montant exact
  options.push({
    montant: totalNet,
    label: 'Exact',
    monnaieARendre: 0,
    isExact: true,
  })

  // 2. Arrondi au millier supérieur le plus proche (si pas déjà exact)
  const arrondi1000 = Math.ceil(totalNet / 1000) * 1000
  if (arrondi1000 > totalNet && !options.some((o) => o.montant === arrondi1000)) {
    options.push({
      montant: arrondi1000,
      label: `${arrondi1000.toLocaleString('fr-FR')} F`,
      monnaieARendre: arrondi1000 - totalNet,
    })
  }

  // 3. Proposer les coupures de billets standards supérieures
  for (const coupure of COUPURES) {
    if (coupure > totalNet && !options.some((o) => o.montant === coupure)) {
      options.push({
        montant: coupure,
        label: `${coupure.toLocaleString('fr-FR')} F`,
        monnaieARendre: coupure - totalNet,
      })
    }
    // Si on a déjà 4 suggestions pertinentes, on s'arrête pour garder une UI ultra-claire
    if (options.length >= 4) break
  }

  // 4. Si le total est très élevé (ex: 28 000 FCFA), proposer les multiples de 10 000 ou 20 000
  if (options.length < 4) {
    const multi10k = Math.ceil(totalNet / 10000) * 10000
    if (multi10k > totalNet && !options.some((o) => o.montant === multi10k)) {
      options.push({
        montant: multi10k,
        label: `${multi10k.toLocaleString('fr-FR')} F`,
        monnaieARendre: multi10k - totalNet,
      })
    }
    const multi20k = Math.ceil(totalNet / 20000) * 20000
    if (multi20k > totalNet && !options.some((o) => o.montant === multi20k)) {
      options.push({
        montant: multi20k,
        label: `${multi20k.toLocaleString('fr-FR')} F`,
        monnaieARendre: multi20k - totalNet,
      })
    }
  }

  return options.slice(0, 4)
}
