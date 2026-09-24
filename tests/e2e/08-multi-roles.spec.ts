import { test, expect } from '@playwright/test'

const TEST_MARCHAND_EMAIL = process.env.TEST_MARCHAND_EMAIL || ''
const TEST_MARCHAND_PWD   = process.env.TEST_MARCHAND_PWD   || ''
const TEST_ACHETEUR_EMAIL = process.env.TEST_ACHETEUR_EMAIL || ''
const TEST_ACHETEUR_PWD   = process.env.TEST_ACHETEUR_PWD   || ''

test.describe('Multi-Rôles — Séparation des espaces', () => {
  test('TC-ROLE-001 — Marchand accède à /boutique, pas acheteur', async ({ page }) => {
    test.skip(!TEST_MARCHAND_EMAIL, 'Credentials marchand requis')

    // Connexion marchand
    await page.goto('/connexion')
    await page.fill('input[name="email"]', TEST_MARCHAND_EMAIL)
    await page.fill('input[name="password"]', TEST_MARCHAND_PWD)
    await page.click('button[type="submit"]')
    await expect(page).not.toHaveURL(/\/connexion/, { timeout: 10000 })

    // Le marchand a accès au dashboard boutique
    await page.goto('/boutique')
    await expect(page).not.toHaveURL(/\/connexion/)
    await expect(page).not.toHaveURL(/403|forbidden/)
  })

  test('TC-ROLE-002 — Acheteur ne peut pas accéder au dashboard boutique', async ({ page }) => {
    test.skip(!TEST_ACHETEUR_EMAIL, 'Credentials acheteur requis')

    await page.goto('/connexion')
    await page.fill('input[name="email"]', TEST_ACHETEUR_EMAIL)
    await page.fill('input[name="password"]', TEST_ACHETEUR_PWD)
    await page.click('button[type="submit"]')
    await expect(page).not.toHaveURL(/\/connexion/, { timeout: 10000 })

    // L'acheteur n'a pas accès au dashboard boutique
    await page.goto('/boutique')
    await expect(page.locator('text=Tableau de bord boutique')).not.toBeVisible()
  })

  test('TC-ROLE-003 — Accès non authentifié à /boutique redirige vers /connexion', async ({ page }) => {
    await page.goto('/boutique')
    // Vérifier la redirection d'un visiteur anonyme
    await expect(page).toHaveURL(/connexion|login/)
  })
})
