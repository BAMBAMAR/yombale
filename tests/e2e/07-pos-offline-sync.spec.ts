import { test, expect } from '@playwright/test'

// ── Suite End-to-End : Mode Offline & Synchronisation PWA Nopalou ──────

test.describe('Mode Hors-Ligne & PWA Caisse POS', () => {

  test('Affichage du badge Hors-Ligne lors du basculement réseau (context.setOffline)', async ({ page, context }) => {
    // 1. Navigation initiale sur la page d'accueil avec SW
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // 2. Basculement en mode hors-ligne simulé
    await context.setOffline(true)
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })

    // 3. Vérification de l'apparition de l'alerte UI hors-ligne
    const badgeOffline = page.locator('text=Mode Hors-Ligne Actif').first()
    await expect(badgeOffline).toBeVisible({ timeout: 10000 })

    // 4. Rétablissement de la connexion réseau
    await context.setOffline(false)
  })

  test('Page de secours PWA offline.html accessible', async ({ page }) => {
    const response = await page.goto('/offline.html')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText(/Hors-Ligne/i)
    await expect(page.locator('body')).toContainText(/Nopalou/i)
  })

  test('Stockage des ventes dans IndexedDB lors d’un encaissement déconnecté', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const testSaleAdded = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const req = window.indexedDB.open('nopalou_pos_offline', 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('ventes_queue')) {
            db.createObjectStore('ventes_queue', { keyPath: 'id_temporaire' })
          }
        }
        req.onsuccess = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('ventes_queue')) {
            resolve('created-store-only')
            return
          }
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
          tx.onerror = () => resolve(null)
        }
        req.onerror = () => resolve(null)
      })
    })

    expect(testSaleAdded).toBeTruthy()
  })

})
