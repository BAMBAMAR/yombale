import { test, expect } from '@playwright/test'

const ADMIN_SECRET = process.env.ADMIN_SECRET || ''

// ── Admin ─────────────────────────────────────────────────────────────

test.describe('Admin login', () => {
  test('page /admin/login charge', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page).not.toHaveURL(/404/)
    await expect(page.locator('input[name="secret"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('/admin sans session redirige vers /admin/login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('mauvais secret → message erreur', async ({ page }) => {
    await page.goto('/admin/login')
    await page.fill('input[name="secret"]', 'mauvais_secret_test')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(4000)
    const url = page.url()
    // Doit rester sur /admin/login avec erreur
    expect(url).toContain('/admin/login')
    await expect(page.locator('[class*="error"], [role="alert"]').first()).toBeVisible({ timeout: 5000 })
  })

  test.describe('Avec ADMIN_SECRET valide', () => {
    test.skip(!ADMIN_SECRET, 'ADMIN_SECRET non défini — passer via env: ADMIN_SECRET=... npx playwright test')

    test('connexion admin réussie', async ({ page }) => {
      await page.goto('/admin/login')
      await page.fill('input[name="secret"]', ADMIN_SECRET)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/admin$/, { timeout: 8000 })
      await expect(page).toHaveURL(/\/admin$/)
    })

    test('dashboard admin charge les stats', async ({ page }) => {
      await page.goto('/admin/login')
      await page.fill('input[name="secret"]', ADMIN_SECRET)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/admin$/, { timeout: 8000 })

      await expect(page.locator('h1')).toContainText(/Dashboard/)
      // Cartes stats
      await expect(page.locator('[class*="admin-stat-card"]').first()).toBeVisible()
    })

    test('navigation admin — annonces, immo, télécom, seo', async ({ page }) => {
      await page.goto('/admin/login')
      await page.fill('input[name="secret"]', ADMIN_SECRET)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/admin$/, { timeout: 8000 })

      for (const route of ['/admin/annonces', '/admin/immo', '/admin/telecom', '/admin/seo', '/admin/compte']) {
        await page.goto(route)
        await expect(page).not.toHaveURL(/\/admin\/login/)
        await expect(page.locator('h1')).toBeVisible()
      }
    })

    test('déconnexion admin fonctionne', async ({ page }) => {
      await page.goto('/admin/login')
      await page.fill('input[name="secret"]', ADMIN_SECRET)
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/admin$/, { timeout: 8000 })

      // Cliquer sur Déconnexion
      await page.locator('button').filter({ hasText: /déconnexion/i }).click()
      await page.waitForURL(/\/admin\/login/, { timeout: 5000 })
      await expect(page).toHaveURL(/\/admin\/login/)

      // Vérifier que l'accès est bien bloqué
      await page.goto('/admin')
      await expect(page).toHaveURL(/\/admin\/login/)
    })
  })
})
