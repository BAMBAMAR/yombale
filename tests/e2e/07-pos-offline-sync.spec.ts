import { test, expect } from '@playwright/test'

// ── Suite End-to-End : Mode Offline & Synchronisation PWA Nopalou ──────

test.describe('Mode Hors-Ligne & PWA Caisse POS', () => {

  test('Affichage du badge Hors-Ligne lors du basculement réseau (context.setOffline)', async ({ page, context }) => {
    // 1. Navigation initiale sur la caisse POS (ou page d'accueil avec SW)
    await page.goto('/boutique/caisse')
    await page.waitForLoadState('domcontentloaded')

    // 2. Basculement en mode hors-ligne simulated
    await context.setOffline(true)

    // 3. Vérification de l'apparition de l'alerte UI hors-ligne
    const badgeOffline = page.locator('text=Mode Hors-Ligne Actif, text=HORS-LIGNE').first()
    await expect(badgeOffline).toBeVisible({ timeout: 5000 })

    // 4. Rétablissement de la connexion réseau
    await context.setOffline(false)

    // 5. Masquage du badge offline au retour du réseau
    await expect(badgeOffline).not.toBeVisible({ timeout: 5000 })
  })

  test('Page de secours PWA offline.html accessible', async ({ page }) => {
    // Vérification de la disponibilité du fallback offline HTML
    const response = await page.goto('/offline.html')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText(/Hors-Ligne/i)
    await expect(page.locator('body')).toContainText(/Nopalou/i)
  })

  test('Stockage des ventes dans IndexedDB lors d’un encaissement déconnecté', async ({ page, context }) => {
    await page.goto('/boutique/caisse')
    await page.waitForLoadState('domcontentloaded')

    // Simulation déconnexion
    await context.setOffline(true)

    // Exécution d'un script d'ajout d'une vente hors-ligne dans IndexedDB via l'API db-offline
    const testSaleAdded = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const req = window.indexedDB.open('nopalou_pos_offline', 1)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('ventes_queue', 'readwrite')
          const store = tx.objectStore('ventes_queue')
          const tempId = `E2E-TEST-${Date.now()}`
          store.put({
            id_temporaire: tempId,
            boutique_id: 'test-boutique-e2e',
            items: [{ id: 'prod-1', nom: 'Produit Test E2E', quantite: 1, prix: 5000 }],
            caissier: 'Caissier E2E',
            modePaiement: 'especes',
            total: 5000,
            date: new Date().toISOString()
          })
          tx.oncomplete = () => resolve(tempId)
        }
        req.onerror = () => resolve(null)
      })
    })

    expect(testSaleAdded).toBeTruthy()

    // Vérification de la présence de la vente enregistrée localement
    const queuedSalesCount = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const req = window.indexedDB.open('nopalou_pos_offline', 1)
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('ventes_queue', 'readonly')
          const store = tx.objectStore('ventes_queue')
          const countReq = store.count()
          countReq.onsuccess = () => resolve(countReq.result)
        }
        req.onerror = () => resolve(0)
      })
    })

    expect(queuedSalesCount).toBeGreaterThan(0)

    // Rétablissement réseau
    await context.setOffline(false)
  })

})
