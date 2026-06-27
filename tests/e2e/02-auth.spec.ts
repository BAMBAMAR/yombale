import { test, expect } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_EMAIL    || ''
const TEST_PASSWORD = process.env.TEST_PASSWORD || ''

// ── Authentification ──────────────────────────────────────────────────

test.describe('Page connexion — sans compte', () => {
  test('charge correctement', async ({ page }) => {
    await page.goto('/connexion')
    await expect(page).toHaveTitle(/Connexion|Nopalou/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('erreur avec mauvais identifiants', async ({ page }) => {
    await page.goto('/connexion')
    await page.fill('input[name="email"]', 'inexistant_xyz_test@gmail.com')
    await page.fill('input[name="password"]', 'mauvais_mdp_xyz')
    await page.click('button[type="submit"]')
    await expect(page.locator('[class*="error"], [role="alert"]').first()).toBeVisible({ timeout: 8000 })
  })

  test('redirect vers /connexion si non connecté sur page protégée', async ({ page }) => {
    for (const url of ['/compte', '/mes-annonces', '/deposer-annonce', '/deposer-immo', '/mes-annonces-immo']) {
      await page.goto(url)
      await expect(page).toHaveURL(/\/connexion/, { timeout: 8000 })
    }
  })
})

test.describe('Page inscription', () => {
  test('charge correctement', async ({ page }) => {
    await page.goto('/inscription')
    await expect(page).toHaveTitle(/Inscription|Nopalou/)
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})

test.describe('Connexion avec compte réel', () => {
  test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Credentials requis: TEST_EMAIL=... TEST_PASSWORD=... npx playwright test')

  test('connexion réussie et session active', async ({ page }) => {
    await page.goto('/connexion')
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')

    // Attendre navigation HORS de /connexion
    await expect(page).not.toHaveURL(/\/connexion/, { timeout: 10000 })

    // Les pages protégées sont accessibles
    await page.goto('/compte')
    await expect(page).not.toHaveURL(/\/connexion/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('déconnexion supprime la session', async ({ page }) => {
    // Connexion
    await page.goto('/connexion')
    await page.fill('input[name="email"]', TEST_EMAIL)
    await page.fill('input[name="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page).not.toHaveURL(/\/connexion/, { timeout: 10000 })

    // Chercher bouton déconnexion et cliquer
    const logoutBtn = page.locator('button, a').filter({ hasText: /déconnexion|logout/i }).first()
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click()
    } else {
      // Chercher dans le menu dropdown
      await page.locator('[class*="navbar-actions"], [class*="user"]').first().click()
      await page.locator('button, a').filter({ hasText: /déconnexion/i }).first().click()
    }

    await page.goto('/compte')
    await expect(page).toHaveURL(/\/connexion/, { timeout: 8000 })
  })
})
