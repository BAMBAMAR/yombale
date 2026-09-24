import { test, expect } from '@playwright/test'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'

// ── SMOKE TESTS — À exécuter après chaque déploiement ──────────────────

test.describe('SMOKE — Backend alive', () => {
  test('GET /health → 200', async ({ request }) => {
    const res = await request.get(`${BACKEND}/health`)
    expect(res.status()).toBe(200)
  })

  test('GET /api/produits → 200 + structure valide', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/produits?limit=1`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('produits')
    expect(Array.isArray(body.produits)).toBe(true)
  })

  test('GET /api/immo → 200 + structure valide', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/immo?limit=1`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('annonces')
  })

  test('GET /api/boutiques sans auth → non 500', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/boutiques/mine`)
    expect([401, 403]).toContain(res.status())
  })

  test('POST /api/annonces sans JWT → 401/403', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/annonces`, {
      data: { titre: 'smoke-test' }
    })
    expect([401, 403]).toContain(res.status())
  })
})

test.describe('SMOKE — Frontend alive', () => {
  test('/ → 200 + titre Nopalou', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Nopalou/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('/immo → 200', async ({ page }) => {
    await page.goto('/immo')
    await expect(page).not.toHaveURL(/404/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('/connexion → formulaire visible', async ({ page }) => {
    await page.goto('/connexion')
    await expect(page.locator('input[type="tel"], input[name="email"]').first()).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('/admin sans session → redirect /admin/login', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('/sitemap.xml → 200 + urlset', async ({ page }) => {
    const res = await page.request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('<urlset')
  })
})
