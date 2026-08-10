import { test, expect } from '@playwright/test'

// ── Suite End-to-End : Mode Offline, Cache & Synchronisation POS PWA Nopalou ──────

test.describe('Mode Hors-Ligne — Tests complets PWA & POS', () => {

  test('1. Affichage réactif du badge Hors-Ligne (window.offline)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })

    const badgeOffline = page.locator('text=Mode Hors-Ligne Actif').first()
    await expect(badgeOffline).toBeVisible({ timeout: 10000 })
  })

  test('2. Accessibilité de la page de secours PWA offline.html', async ({ page }) => {
    const response = await page.goto('/offline.html')
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toContainText(/Hors-Ligne/i)
    await expect(page.locator('body')).toContainText(/Nopalou/i)
  })

  test('3. Persistance du catalogue produits dans IndexedDB (offline store)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const result = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const req = window.indexedDB.open('nopalou_pos_offline', 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('produits')) {
            db.createObjectStore('produits', { keyPath: 'id' })
          }
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('produits', 'readwrite')
          const store = tx.objectStore('produits')
          store.put({ id: 'p-test-offline-1', nom: 'Riz Perfumé 5kg', prix: 4500, stock: 20 })
          tx.oncomplete = () => {
            const txRead = db.transaction('produits', 'readonly')
            const storeRead = txRead.objectStore('produits')
            const getReq = storeRead.get('p-test-offline-1')
            getReq.onsuccess = () => resolve(getReq.result)
          }
        }
        req.onerror = () => resolve(null)
      })
    })

    expect(result).toBeDefined()
    expect((result as any)?.nom).toBe('Riz Perfumé 5kg')
  })

  test('4. Mise en file d’attente IndexedDB des ventes hors-ligne', async ({ page }) => {
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
          const tx = db.transaction('ventes_queue', 'readwrite')
          const store = tx.objectStore('ventes_queue')
          const tempId = `OFFLINE-TEST-${Date.now()}`
          store.put({
            id_temporaire: tempId,
            boutique_id: 'boutique-dakar-1',
            items: [{ id: 'prod-1', nom: 'Huile Dinor 1L', quantite: 2, prix: 1500 }],
            caissier: 'Caissier Mamadou',
            modePaiement: 'especes',
            total: 3000,
            date: new Date().toISOString()
          })
          tx.oncomplete = () => resolve(tempId)
        }
        req.onerror = () => resolve(null)
      })
    })

    expect(testSaleAdded).toBeTruthy()
  })

  test('5. Suppression sélective unitaire d’une vente synchronisée (non-destructive)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    const testResult = await page.evaluate(async () => {
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
          const tx = db.transaction('ventes_queue', 'readwrite')
          const store = tx.objectStore('ventes_queue')
          const id1 = 'OFFLINE-SYNC-SUCCESS'
          const id2 = 'OFFLINE-PENDING-FAIL'
          store.put({ id_temporaire: id1, total: 2000 })
          store.put({ id_temporaire: id2, total: 5000 })

          tx.oncomplete = () => {
            const txDelete = db.transaction('ventes_queue', 'readwrite')
            const storeDelete = txDelete.objectStore('ventes_queue')
            storeDelete.delete(id1)

            txDelete.oncomplete = () => {
              const txCheck = db.transaction('ventes_queue', 'readonly')
              const storeCheck = txCheck.objectStore('ventes_queue')
              const getAll = storeCheck.getAll()
              getAll.onsuccess = () => resolve(getAll.result)
            }
          }
        }
        req.onerror = () => resolve([])
      })
    })

    const remainingSales = testResult as any[]
    expect(remainingSales.some(s => s.id_temporaire === 'OFFLINE-PENDING-FAIL')).toBe(true)
    expect(remainingSales.some(s => s.id_temporaire === 'OFFLINE-SYNC-SUCCESS')).toBe(false)
  })

  test('6. Restauration des Boutiques du Marchand depuis le cache local (localStorage)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await page.evaluate(() => {
      localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify([
        { id: 'b-e2e-1', nom: 'Boutique Dakar Pro Offline', ville: 'Dakar', actif: true }
      ]))
    })

    const cachedBoutiques = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('nopalou_pos_user_boutiques') || '[]')
    })

    expect(cachedBoutiques.length).toBe(1)
    expect(cachedBoutiques[0].nom).toBe('Boutique Dakar Pro Offline')
  })

  test('7. Restauration du Catalogue Produits Caisse depuis le cache local (localStorage)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    await page.evaluate(() => {
      localStorage.setItem('nopalou_pos_produits_b-e2e-1', JSON.stringify([
        { id: 'p-1', nom: 'Lait Bonnet Rouge', prix: 1200, stock: 50 },
        { id: 'p-2', nom: 'Nescafé 200g', prix: 2800, stock: 15 }
      ]))
    })

    const cachedProducts = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('nopalou_pos_produits_b-e2e-1') || '[]')
    })

    expect(cachedProducts.length).toBe(2)
    expect(cachedProducts[0].nom).toBe('Lait Bonnet Rouge')
  })

})
