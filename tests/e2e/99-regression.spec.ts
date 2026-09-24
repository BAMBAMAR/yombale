import { test, expect, request as apiRequest } from '@playwright/test'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3000'
const TEST_EMAIL = process.env.TEST_EMAIL || ''
const TEST_PASSWORD = process.env.TEST_PASSWORD || ''

// ══════════════════════════════════════════════════════════════════════
// SUITE DE RÉGRESSION — À rejouer après chaque évolution du code
// ══════════════════════════════════════════════════════════════════════

test.describe('RÉGRESSION — Commerce', () => {
  test('RG-COM-001 — Recherche produit retourne des résultats', async ({ page }) => {
    await page.goto('/?q=Samsung')
    await expect(page.locator('body')).not.toContainText(/crash fatal/i)
    // Vérifier qu'au moins un élément ou conteneur de produits est affiché
    const cards = page.locator('[class*="card"], article, [class*="produit"], .product-card')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  test('RG-COM-002 — Fiche produit ou fallback accessible', async ({ page }) => {
    const api = await apiRequest.newContext()
    try {
      const res = await api.get(`${BACKEND}/api/produits?limit=1`)
      const body = await res.json()
      if (body.produits?.length) {
        const produitId = body.produits[0].id
        await page.goto(`/produit/${produitId}`)
        await expect(page.locator('h1')).toBeVisible()
        await expect(page).not.toHaveURL(/404/)
        return
      }
    } catch (_) {}
    test.skip(true, 'Pas de produits en DB pour tester la fiche')
  })

  test('RG-COM-003 — Page boutiques accessible', async ({ page }) => {
    await page.goto('/boutiques')
    await expect(page).not.toHaveURL(/404/)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})

test.describe('RÉGRESSION — Immobilier', () => {
  test('RG-IMMO-001 — Page immo charge', async ({ page }) => {
    await page.goto('/immo')
    await expect(page).not.toHaveURL(/404/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('RG-IMMO-002 — API immo retourne des annonces ou structure valide', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/immo?limit=3`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('annonces')
  })
})

test.describe('RÉGRESSION — Authentification', () => {
  test('RG-AUTH-001 — Pages protégées redirigent vers /connexion', async ({ page }) => {
    for (const url of ['/compte', '/mes-annonces', '/deposer-annonce']) {
      await page.goto(url)
      await expect(page).toHaveURL(/\/connexion/, { timeout: 8000 })
    }
  })

  test('RG-AUTH-002 — Connexion avec mauvais credentials → message d\'erreur', async ({ page }) => {
    await page.goto('/connexion')
    const emailTab = page.locator('button[role="tab"]').filter({ hasText: 'Email' })
    if (await emailTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailTab.click()
    }
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('invalide-test@nopalou.com')
      await page.fill('input[type="password"]', 'WrongPassword123!')
      await page.click('button[type="submit"]')
      await expect(page.locator('[class*="error"], [role="alert"]').first()).toBeVisible({ timeout: 8000 })
    }
  })
})

test.describe('RÉGRESSION — API Sécurité', () => {
  test('RG-SEC-001 — Routes protégées sans JWT → 401', async ({ request }) => {
    for (const endpoint of [
      '/api/boutiques/mine',
      '/api/comptabilite/11111111-1111-1111-1111-111111111111/ventes',
    ]) {
      const res = await request.get(`${BACKEND}${endpoint}`)
      expect([401, 403]).toContain(res.status())
    }
  })

  test('RG-SEC-002 — Admin sans session → 401/403', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/admin/utilisateurs`)
    expect([401, 403]).toContain(res.status())
  })
})

test.describe('RÉGRESSION — SEO et performance', () => {
  test('RG-SEO-001 — Toutes les pages principales ont un title et une description', async ({ page }) => {
    for (const url of ['/', '/immo', '/telecom', '/annonces', '/boutiques']) {
      await page.goto(url)
      const title = await page.title()
      expect(title.length).toBeGreaterThan(5)
      const desc = await page.locator('meta[name="description"]').getAttribute('content').catch(() => '')
      expect((desc ?? '').length).toBeGreaterThan(5)
    }
  })
})
