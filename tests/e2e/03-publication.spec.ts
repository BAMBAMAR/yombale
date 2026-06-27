import { test, expect, Page } from '@playwright/test'

const TEST_EMAIL    = process.env.TEST_EMAIL    || ''
const TEST_PASSWORD = process.env.TEST_PASSWORD || ''
const hasCredentials = !!(TEST_EMAIL && TEST_PASSWORD)

// ── Helper : connexion robuste ───────────────────────────────────────
async function seConnecter(page: Page): Promise<boolean> {
  await page.goto('/connexion')
  await page.fill('input[name="email"]', TEST_EMAIL)
  await page.fill('input[name="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')

  try {
    // Attendre navigation HORS de /connexion (vrai succès)
    await expect(page).not.toHaveURL(/\/connexion/, { timeout: 10000 })
    return true
  } catch {
    // Login échoué
    const errorEl = page.locator('[class*="error"], [role="alert"]')
    const errText = await errorEl.first().textContent().catch(() => 'inconnu')
    console.log('❌ Login échoué:', errText)
    return false
  }
}

// ── Tests publication ────────────────────────────────────────────────

test.describe('Publication annonce classifiée', () => {
  test.skip(!hasCredentials, 'TEST_EMAIL et TEST_PASSWORD requis')

  test('TC-PUB-001 — flux complet : catégorie → détails → soumission', async ({ page }) => {
    const ok = await seConnecter(page)
    expect(ok, 'Login échoué — vérifier TEST_EMAIL / TEST_PASSWORD').toBeTruthy()

    await page.goto('/deposer-annonce')
    await expect(page).not.toHaveURL(/\/connexion/)

    // Étape 1 — catégorie
    await expect(page.locator('text=1 / 3')).toBeVisible({ timeout: 5000 })
    await page.locator('button').filter({ hasText: /téléphone|smartphone/i }).first().click()

    // Étape 2 — détails
    await expect(page.locator('text=2 / 3')).toBeVisible({ timeout: 5000 })
    await page.fill('input[name="titre"]', 'iPhone 13 256Go - Test Playwright')
    await page.fill('input[name="prix"]', '280000')

    // Marque (premier champ placeholder contenant "Samsung" ou "marque" ou "Apple")
    const inputs = await page.locator('input[type="text"]').all()
    for (const inp of inputs) {
      const ph = (await inp.getAttribute('placeholder') ?? '').toLowerCase()
      if (ph.includes('samsung') || ph.includes('marque') || ph.includes('apple') || ph.includes('ex:')) {
        const val = await inp.inputValue()
        if (!val) { await inp.fill('Apple'); break }
      }
    }

    // État
    const stateSelect = page.locator('select').first()
    await stateSelect.selectOption({ index: 1 })

    // Ville
    const villeSelect = page.locator('select[name="ville"]')
    if (await villeSelect.isVisible()) await villeSelect.selectOption('Dakar')

    // Téléphone
    await page.fill('input[name="contact_tel"]', '771234567')

    // Passer à l'étape 3
    await page.locator('button[type="submit"]').filter({ hasText: /continu/i }).click()
    await expect(page.locator('text=3 / 3')).toBeVisible({ timeout: 5000 })

    // Étape 3 — soumettre
    const submitBtn = page.locator('button[type="submit"]').filter({ hasText: /publier/i })
    await submitBtn.click()

    // Attendre la réponse (max 15s)
    await page.waitForTimeout(12000)

    const currentUrl = page.url()
    const errorEl = page.locator('[class*="annonce-error"], [class*="error"]:visible')
    const errorCount = await errorEl.count()
    const errorText = errorCount > 0 ? (await errorEl.first().textContent() ?? '') : ''

    console.log('📍 URL après soumission:', currentUrl)
    console.log('💬 Message erreur:', errorText || '(aucun)')

    // Analyse du résultat
    if (currentUrl.includes('/payer-annonce') || currentUrl.includes('/mes-annonces')) {
      console.log('✅ PASS — Publication réussie !')
      expect(true).toBeTruthy()
    } else if (errorText.includes('401') || errorText.toLowerCase().includes('non autorisé')) {
      console.log('❌ FAIL — Erreur 401 : JWT_SECRET manquant ou incorrect dans Render')
      throw new Error(`Publication échoue avec 401 — Ajouter JWT_SECRET dans Render nopalou-frontend (même valeur que le backend)`)
    } else if (errorText.toLowerCase().includes('réseau') || errorText.toLowerCase().includes('fetch')) {
      console.log('❌ FAIL — Erreur réseau : BACKEND_URL probablement manquant dans Render')
      throw new Error(`Publication échoue avec erreur réseau — Vérifier BACKEND_URL dans Render nopalou-frontend`)
    } else if (errorText) {
      console.log('❌ FAIL — Erreur:', errorText)
      throw new Error(`Publication échoue: ${errorText}`)
    } else {
      console.log('⚠️ Résultat inattendu — URL:', currentUrl)
      throw new Error(`URL inattendue après publication: ${currentUrl}`)
    }
  })

  test('TC-PUB-002 — vérification accès /deposer-annonce', async ({ page }) => {
    const ok = await seConnecter(page)
    expect(ok, 'Login échoué').toBeTruthy()

    await page.goto('/deposer-annonce')
    await expect(page).not.toHaveURL(/\/connexion/)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=1 / 3')).toBeVisible()
  })

  test('TC-PUB-003 — navigation entre étapes (retour)', async ({ page }) => {
    const ok = await seConnecter(page)
    expect(ok, 'Login échoué').toBeTruthy()

    await page.goto('/deposer-annonce')
    await page.locator('button').filter({ hasText: /téléphone|smartphone/i }).first().click()
    await expect(page.locator('text=2 / 3')).toBeVisible({ timeout: 5000 })

    // Retour à l'étape 1
    await page.locator('button').filter({ hasText: /retour/i }).click()
    await expect(page.locator('text=1 / 3')).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Publication annonce immobilière', () => {
  test.skip(!hasCredentials, 'TEST_EMAIL et TEST_PASSWORD requis')

  test('TC-PUB-IMMO-001 — flux complet deposer-immo', async ({ page }) => {
    const ok = await seConnecter(page)
    expect(ok, 'Login échoué').toBeTruthy()

    await page.goto('/deposer-immo')
    await expect(page).not.toHaveURL(/\/connexion/)
    await expect(page.locator('input[name="titre"]')).toBeVisible({ timeout: 5000 })

    await page.fill('input[name="titre"]', 'Appartement F3 Plateau - Test Playwright')
    await page.fill('input[name="prix"]', '180000')

    const typeBien = page.locator('select[name="type_bien"]')
    if (await typeBien.isVisible()) await typeBien.selectOption({ index: 1 })

    const surface = page.locator('input[name="surface_m2"], input[name="surface"]')
    if (await surface.first().isVisible()) await surface.first().fill('80')

    const ville = page.locator('select[name="ville"]')
    if (await ville.isVisible()) await ville.selectOption('Dakar')

    const tel = page.locator('input[name="contact_tel"]')
    if (await tel.isVisible()) await tel.fill('771234567')

    await page.locator('button[type="submit"]').filter({ hasText: /publier|soumettre|envoyer/i }).first().click()
    await page.waitForTimeout(10000)

    const currentUrl = page.url()
    const errorEl = page.locator('[class*="error"]:visible, [role="alert"]:visible')
    const errorText = await errorEl.first().textContent().catch(() => '')

    console.log('📍 URL après soumission immo:', currentUrl)
    console.log('💬 Message erreur:', errorText || '(aucun)')

    if (currentUrl.includes('/mes-annonces-immo') || currentUrl.includes('/immo')) {
      console.log('✅ PASS — Publication immo réussie !')
      expect(true).toBeTruthy()
    } else if (errorText?.includes('401')) {
      throw new Error('Publication immo échoue avec 401 — Ajouter JWT_SECRET dans Render nopalou-frontend')
    } else if (errorText) {
      throw new Error(`Publication immo échoue: ${errorText}`)
    } else {
      throw new Error(`URL inattendue: ${currentUrl}`)
    }
  })
})

test.describe('Mes annonces (après connexion)', () => {
  test.skip(!hasCredentials, 'TEST_EMAIL et TEST_PASSWORD requis')

  test('TC-MES-001 — /mes-annonces accessible', async ({ page }) => {
    await seConnecter(page)
    await page.goto('/mes-annonces')
    await expect(page).not.toHaveURL(/\/connexion/)
    await expect(page.locator('h1')).toBeVisible()
  })

  test('TC-MES-002 — /mes-annonces-immo accessible', async ({ page }) => {
    await seConnecter(page)
    await page.goto('/mes-annonces-immo')
    await expect(page).not.toHaveURL(/\/connexion/)
    await expect(page.locator('h1')).toBeVisible()
  })
})
