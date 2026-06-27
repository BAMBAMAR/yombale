import { test, expect } from '@playwright/test'

// ── Pages publiques — chargement et contenu de base ──────────────────

test.describe('Accueil', () => {
  test('chargement et éléments essentiels', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Nopalou/)
    await expect(page.locator('nav.navbar')).toBeVisible()
    await expect(page.locator('h1')).toContainText(/Sénégal/i)
    // Barre de recherche
    await expect(page.locator('input[placeholder*="chercher"], input[placeholder*="Chercher"], input[type="search"]').first()).toBeVisible()
  })

  test('recherche produit depuis accueil', async ({ page }) => {
    await page.goto('/')
    const search = page.locator('input[placeholder*="chercher"], input[placeholder*="Chercher"], input[type="search"]').first()
    await search.fill('Samsung')
    await search.press('Enter')
    await page.waitForURL(/[?&]q=Samsung/i, { timeout: 8000 })
    await expect(page.locator('body')).toContainText(/Samsung|résultat|produit/i)
  })

  test('liens navbar fonctionnels', async ({ page }) => {
    await page.goto('/')
    await page.click('a[href="/immo"]')
    await expect(page).toHaveURL(/\/immo/)

    await page.goto('/')
    await page.click('a[href="/telecom"]')
    await expect(page).toHaveURL(/\/telecom/)

    await page.goto('/')
    await page.click('a[href="/annonces"]')
    await expect(page).toHaveURL(/\/annonces/)
  })
})

test.describe('Produits', () => {
  test('page accueil charge des produits', async ({ page }) => {
    await page.goto('/')
    // Attendre que des produits apparaissent
    const cards = page.locator('[class*="produit-card"], [class*="product-card"], .card').first()
    await expect(cards).toBeVisible({ timeout: 10000 })
  })

  test('fiche produit accessible', async ({ page }) => {
    await page.goto('/')
    // Cliquer sur le premier produit visible
    const link = page.locator('a[href*="/produit/"]').first()
    const href = await link.getAttribute('href')
    if (!href) return
    await page.goto(href)
    await expect(page).toHaveURL(/\/produit\/\d+/)
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('Immobilier', () => {
  test('page immo charge', async ({ page }) => {
    await page.goto('/immo')
    await expect(page).toHaveTitle(/Immo|Immobilier/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('filtres immo fonctionnels', async ({ page }) => {
    await page.goto('/immo')
    // Type de bien
    const typeSelect = page.locator('select[name*="type"], select').first()
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 })
    }
  })
})

test.describe('Télécom', () => {
  test('page télécom charge', async ({ page }) => {
    await page.goto('/telecom')
    await expect(page).toHaveTitle(/Telecom|Télécom|Forfait/)
    await expect(page.locator('h1')).toBeVisible()
  })
})

test.describe('Annonces', () => {
  test('page annonces charge', async ({ page }) => {
    await page.goto('/annonces')
    await expect(page).toHaveTitle(/Annonce/)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})

test.describe('Catégories SEO', () => {
  const cats = ['smartphones', 'informatique', 'tv-electro', 'mode', 'maison', 'auto-moto']
  for (const cat of cats) {
    test(`/categorie/${cat} charge sans erreur`, async ({ page }) => {
      await page.goto(`/categorie/${cat}`)
      await expect(page).not.toHaveURL(/404|error/)
      await expect(page.locator('h1')).toBeVisible()
    })
  }
})

test.describe('Guide achat', () => {
  test('page guide-achat charge', async ({ page }) => {
    await page.goto('/guide-achat')
    await expect(page).not.toHaveURL(/404/)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})

test.describe('Boutiques', () => {
  test('page boutiques charge', async ({ page }) => {
    await page.goto('/boutiques')
    await expect(page).not.toHaveURL(/404/)
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})

test.describe('Pages légales', () => {
  for (const page_ of ['/mentions-legales', '/confidentialite', '/cgu']) {
    test(`${page_} charge sans erreur`, async ({ page }) => {
      await page.goto(page_)
      await expect(page).not.toHaveURL(/404/)
      await expect(page.locator('h1')).toBeVisible()
    })
  }
})

test.describe('SEO et meta', () => {
  test('pages principales ont title et description', async ({ page }) => {
    for (const url of ['/', '/immo', '/telecom', '/annonces']) {
      await page.goto(url)
      const title = await page.title()
      expect(title.length).toBeGreaterThan(10)
      const desc = await page.locator('meta[name="description"]').getAttribute('content')
      expect((desc ?? '').length).toBeGreaterThan(20)
    }
  })

  test('sitemap.xml accessible', async ({ page }) => {
    const res = await page.request.get('/sitemap.xml')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('<urlset')
    expect(body).toContain('nopalou.com')
  })

  test('robots.txt accessible', async ({ page }) => {
    const res = await page.request.get('/robots.txt')
    expect(res.status()).toBe(200)
    const body = await res.text()
    expect(body).toContain('Sitemap')
  })
})
