// AUD-158 : seuls ces budgets ont une page « moins de N FCFA » (même liste que le sitemap et les liens internes).
// Toute autre valeur répond 404 : sans liste blanche, chaque nombre serait une page indexable de plus.
export const BUDGETS_PAGES = [50000, 100000] as const

/** Vrai si `n` est un budget qui a sa page. */
export function budgetAutorise(n: number): boolean {
  return (BUDGETS_PAGES as readonly number[]).includes(n)
}
