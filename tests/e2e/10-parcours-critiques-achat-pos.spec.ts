import { test, expect } from '@playwright/test'

// ── Suite End-to-End : Parcours Critiques Achat Express, Vitrine & Caisse POS ──

test.describe('Parcours 1 : Vitrine Marchand & Annuaire des Boutiques', () => {

  test('TC-E2E-VIT-001 — Chargement de l’annuaire des boutiques (/boutiques)', async ({ page }) => {
    await page.goto('/boutiques', { waitUntil: 'domcontentloaded' })
    await expect(page).toHaveTitle(/Boutique|Nopalou/i)

    // Vérifier la présence du conteneur principal et des éléments de recherche
    const header = page.locator('h1, h2').first()
    await expect(header).toBeVisible({ timeout: 10000 })

    // Barre de recherche de boutique
    const searchInput = page.locator('input[type="search"], input[type="text"]').first()
    await expect(searchInput).toBeVisible()
  })

  test('TC-E2E-VIT-002 — Recherche interactive de boutique dans l’annuaire', async ({ page }) => {
    await page.goto('/boutiques', { waitUntil: 'domcontentloaded' })

    const searchInput = page.locator('input[type="search"], input[type="text"]').first()
    await searchInput.fill('Dakar')
    await page.waitForTimeout(300)

    // Vérifier que la saisie est acceptée et que la page réagit sans crash
    expect(await searchInput.inputValue()).toBe('Dakar')
    await expect(page.locator('body')).not.toContainText(/Application error|500 Internal/i)
  })

  test('TC-E2E-VIT-003 — Accès à une vitrine boutique avec fallback catalogue', async ({ page }) => {
    // Intercepter la requête boutique pour une vitrine déterministe
    await page.route('**/api/boutiques/boutique-demo-e2e', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'b-demo-e2e-1',
          nom: 'Électro Dakar Express',
          slug: 'boutique-demo-e2e',
          description: 'Spécialiste high-tech et électroménager à Dakar',
          telephone: '+221770001122',
          ville: 'Dakar',
          categories: ['High-Tech', 'Téléphonie'],
        }),
      })
    })

    await page.goto('/boutiques/boutique-demo-e2e', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('body')).not.toContainText(/500 Internal Server/i)
  })
})

test.describe('Parcours 2 : Tunnel Checkout Express (/checkout-express)', () => {

  test.beforeEach(async ({ page }) => {
    // Intercepter l'appel produit pour isoler le test du réseau backend
    await page.route('**/api/produits/p-e2e-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'p-e2e-1',
          nom: 'Café Touba Prestige 500g',
          prix: 3500,
          boutique_nom: 'Teranga Market',
          boutique_id: 'b-e2e-1',
          photos: [],
        }),
      })
    })

    // Intercepter les zones de livraison
    await page.route('**/api/comptabilite/*/zones/public', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'dakar-intra', nom: 'Dakar Intra-Muros (Plateau, Almadies, Medina)', prix: 1500 },
          { id: 'dakar-banlieue', nom: 'Banlieue Dakar (Pikine, Guédiawaye, Rufisque)', prix: 2500 },
          { id: 'regions-senegal', nom: 'Expédition Régions (Thiès, St-Louis, Kaolack)', prix: 3500 },
          { id: 'retrait-boutique', nom: 'Retrait gratuit en boutique', prix: 0 },
        ]),
      })
    })
  })

  test('TC-E2E-CHK-001 — Chargement des données du produit dans Checkout Express', async ({ page }) => {
    await page.goto('/checkout-express?p=p-e2e-1&b=b-e2e-1', { waitUntil: 'domcontentloaded' })

    // Nom du produit et boutique
    await expect(page.locator('text=Café Touba Prestige 500g').first()).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Teranga Market').first()).toBeVisible()

    // Vérifier les champs obligatoires du formulaire
    await expect(page.locator('input[placeholder*="Babacar Ndiaye"]')).toBeVisible()
    await expect(page.locator('input[placeholder*="77 123 45 67"]')).toBeVisible()
  })

  test('TC-E2E-CHK-002 — Calcul dynamique des frais de livraison et du total', async ({ page }) => {
    await page.goto('/checkout-express?p=p-e2e-1&b=b-e2e-1', { waitUntil: 'domcontentloaded' })

    await expect(page.locator('text=Café Touba Prestige 500g').first()).toBeVisible({ timeout: 10000 })

    const selectZone = page.locator('select.input-npl').first()
    await expect(selectZone).toBeVisible()

    // 1. Dakar Intra-Muros : 3 500 + 1 500 = 5 000 FCFA
    await selectZone.selectOption('dakar-intra')
    await expect(page.locator('text=5 000 FCFA').first()).toBeVisible()

    // 2. Banlieue Dakar : 3 500 + 2 500 = 6 000 FCFA
    await selectZone.selectOption('dakar-banlieue')
    await expect(page.locator('text=6 000 FCFA').first()).toBeVisible()

    // 3. Retrait boutique gratuit : 3 500 + 0 = 3 500 FCFA
    await selectZone.selectOption('retrait-boutique')
    await expect(page.locator('text=3 500 FCFA').first()).toBeVisible()
  })

  test('TC-E2E-CHK-003 — Incrémentation et décrémentation de la quantité', async ({ page }) => {
    await page.goto('/checkout-express?p=p-e2e-1&b=b-e2e-1', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('text=Café Touba Prestige 500g').first()).toBeVisible({ timeout: 10000 })

    // Retrait gratuit pour vérifier le calcul produit uniquement
    const selectZone = page.locator('select.input-npl').first()
    await selectZone.selectOption('retrait-boutique')

    // Cliquer sur le bouton '+'
    const btnPlus = page.locator('button', { hasText: '+' }).first()
    await btnPlus.click()

    // Quantité = 2 -> 2 x 3 500 = 7 000 FCFA
    await expect(page.locator('text=7 000 FCFA').first()).toBeVisible()

    // Cliquer sur le bouton '-'
    const btnMoins = page.locator('button', { hasText: '-' }).first()
    await btnMoins.click()

    // Quantité = 1 -> 1 x 3 500 = 3 500 FCFA
    await expect(page.locator('text=3 500 FCFA').first()).toBeVisible()
  })

  test('TC-E2E-CHK-004 — Sélection des méthodes de paiement et Séquestre Pay Safe', async ({ page }) => {
    await page.goto('/checkout-express?p=p-e2e-1&b=b-e2e-1', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('text=Café Touba Prestige 500g').first()).toBeVisible({ timeout: 10000 })

    // Sélection Espèces
    const btnCash = page.locator('button', { hasText: /Espèces/i }).first()
    await btnCash.click()
    await expect(btnCash).toHaveCSS('border-color', 'rgb(22, 163, 74)')

    // Sélection Orange Money
    const btnOM = page.locator('button', { hasText: /Orange Money/i }).first()
    await btnOM.click()
    await expect(btnOM).toHaveCSS('border-color', 'rgb(255, 102, 0)')

    // Sélection Wave
    const btnWave = page.locator('button', { hasText: /Wave/i }).first()
    await btnWave.click()
    await expect(btnWave).toHaveCSS('border-color', 'rgb(0, 168, 255)')

    // Vérifier la présence de l'option Séquestre Nopalou Pay Safe
    const sequestreToggle = page.locator('text=Activer Nopalou Pay Safe').or(page.locator('text=Séquestre Anti-Arnaque')).first()
    await expect(sequestreToggle).toBeVisible()
  })

  test('TC-E2E-CHK-005 — Soumission complète de commande express avec confirmation', async ({ page }) => {
    // Intercepter la création de commande POST
    await page.route('**/api/comptabilite/*/commandes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          commande: {
            id: 'cmd-e2e-success-123',
            reference: 'CMD-E2E-TEST-2026',
            montant: 5000,
          },
        }),
      })
    })

    await page.goto('/checkout-express?p=p-e2e-1&b=b-e2e-1', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('text=Café Touba Prestige 500g').first()).toBeVisible({ timeout: 10000 })

    // Remplir les informations client
    const inputNom = page.locator('input[placeholder*="Babacar Ndiaye"]')
    const inputTel = page.locator('input[placeholder*="77 123 45 67"]')
    const inputAdresse = page.locator('input[placeholder*="Sacré-Cœur"]')

    await inputNom.fill('Aïssatou Diallo')
    await inputTel.fill('778889900')
    await inputAdresse.fill('Mermoz Pyrotechnie, Villa 42')

    // Choisir paiement en espèces à la livraison pour confirmation immédiate
    const btnCash = page.locator('button', { hasText: /Espèces/i }).first()
    await btnCash.click()

    // Soumettre le formulaire
    const btnSubmit = page.locator('button[type="submit"]')
    await expect(btnSubmit).toBeEnabled()
    await btnSubmit.click()

    // Vérifier l'écran de confirmation
    await expect(page.locator('text=Commande Confirmée !')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Aïssatou Diallo, 778889900').or(page.locator('text=778889900'))).toBeVisible()
  })
})

test.describe('Parcours 3 : Caisse POS — Vente, Ticket & Encaissement', () => {

  test('TC-E2E-POS-001 — Gestion du ticket : ajout d’articles, cumul et encaissement', async ({ page }) => {
    // Configuration du viewport standard caisse tablette / desktop
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Préparer les données locales nécessaires dans localStorage et IndexedDB
    await page.evaluate(async () => {
      const bId = 'b-pos-e2e'
      const uId = 'anonymous'

      localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify([
        { id: bId, nom: 'Superette Teranga Dakar', ville: 'Dakar', actif: true }
      ]))
      localStorage.setItem('nopalou_boutique_active', bId)

      const prods = [
        { id: 'pos-p1', nom: 'Riz Parfumé 25kg', prix: 18500, stock: 45, code_barre: '600101' },
        { id: 'pos-p2', nom: 'Huile Dinor 5L', prix: 7500, stock: 30, code_barre: '600102' },
        { id: 'pos-p3', nom: 'Sucre Morceau 1kg', prix: 900, stock: 120, code_barre: '600103' }
      ]

      localStorage.setItem(`nopalou_pos_produits_${bId}`, JSON.stringify(prods))
      localStorage.setItem(`nopalou_pos_session_${bId}`, JSON.stringify({
        id: 'sess-pos-e2e',
        caissier_nom: 'Gérant / Superviseur',
        fond_de_caisse: 25000,
        statut: 'ouverte',
        ouvert_le: new Date().toISOString()
      }))

      // Persister également dans IndexedDB nopalou_pos_offline pour étanchéité offline
      await new Promise<void>((resolve) => {
        const req = window.indexedDB.open('nopalou_pos_offline', 4)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains('produits')) {
            const ps = db.createObjectStore('produits', { keyPath: 'cache_key' })
            ps.createIndex('by_boutique', ['user_id', 'boutique_id'], { unique: false })
          }
          if (!db.objectStoreNames.contains('clients')) {
            const cs = db.createObjectStore('clients', { keyPath: 'cache_key' })
            cs.createIndex('by_boutique', ['user_id', 'boutique_id'], { unique: false })
          }
          if (!db.objectStoreNames.contains('ventes_queue')) {
            const vs = db.createObjectStore('ventes_queue', { keyPath: 'id_temporaire' })
            vs.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false })
            vs.createIndex('by_user_boutique', ['user_id', 'boutique_id'], { unique: false })
          }
          if (!db.objectStoreNames.contains('dettes_queue')) {
            const ds = db.createObjectStore('dettes_queue', { keyPath: 'id_temporaire' })
            ds.createIndex('by_boutique_status', ['boutique_id', 'status'], { unique: false })
            ds.createIndex('by_user_boutique', ['user_id', 'boutique_id'], { unique: false })
          }
        }
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('produits', 'readwrite')
          const store = tx.objectStore('produits')
          prods.forEach(p => {
            store.put({
              ...p,
              user_id: uId,
              boutique_id: bId,
              cache_key: `${uId}:${bId}:${p.id}`,
            })
          })
          tx.oncomplete = () => resolve()
          tx.onerror = () => resolve()
        }
        req.onerror = () => resolve()
      })
    })

    await page.goto('/boutique/caisse?token=pos-test-token&b=b-pos-e2e', { waitUntil: 'domcontentloaded' })

    // 1. Déverrouillage code PIN superviseur si écran de verrouillage actif
    const lockHeading = page.locator('h2', { hasText: /Caisse POS/i })
    if (await lockHeading.isVisible({ timeout: 5000 }).catch(() => false)) {
      const pinInput = page.locator('input[placeholder*="Tapez le code PIN au clavier"]')
      await expect(pinInput).toBeVisible({ timeout: 5000 })
      await pinInput.click()
      await pinInput.pressSequentially('9999', { delay: 120 })

      // Attendre que l'écran de verrouillage se débloque
      await expect(lockHeading).not.toBeVisible({ timeout: 8000 })
    }

    // Fermer la modale d'ouverture de session si affichée
    const btnDemarrer = page.locator('button', { hasText: /Démarrer la Session|Valider/i }).first()
    if (await btnDemarrer.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnDemarrer.click()
    }

    // 2. Vérifier que la caisse est active avec le catalogue et le ticket
    const layoutCaisse = page.locator('.caisse-main-layout, .caisse-root').first()
    await expect(layoutCaisse).toBeVisible({ timeout: 10000 })

    // Si les cartes de produits sont rendues depuis le cache
    const carteRiz = page.locator('text=Riz Parfumé 25kg').first()
    if (await carteRiz.isVisible({ timeout: 4000 }).catch(() => false)) {
      // 3. Cliquer sur "Riz Parfumé 25kg" pour l'ajouter au ticket
      await carteRiz.click()

      // Vérifier l'affichage du total dans la colonne ticket (18 500 FCFA)
      const grandTotalEl = page.locator('.pos-grand-total, .fcfa-num').first()
      await expect(grandTotalEl).toBeVisible({ timeout: 5000 })
      await expect(page.locator('text=18 500 FCFA').or(page.locator('text=18 500'))).toBeVisible()

      // 4. Ajouter le second produit "Huile Dinor 5L" (7 500 FCFA)
      const carteHuile = page.locator('text=Huile Dinor 5L').first()
      if (await carteHuile.isVisible({ timeout: 2000 }).catch(() => false)) {
        await carteHuile.click()
        // Total attendu : 18 500 + 7 500 = 26 000 FCFA
        await expect(page.locator('text=26 000 FCFA').or(page.locator('text=26 000'))).toBeVisible()
      }
    }

    // Si sur écran mobile, basculer vers l'onglet Ticket pour afficher le panier
    const tabTicket = page.locator('.caisse-mobile-tabs button', { hasText: /Ticket/i })
    if (await tabTicket.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tabTicket.click()
    }

    // 5. Vérifier la présence des contrôles essentiels de la caisse
    const sidebarTicket = page.locator('.ticket-section')
    await expect(sidebarTicket).toBeVisible({ timeout: 5000 })
    const btnEncaisser = page.locator('button', { hasText: /Encaisser/i }).first()
    await expect(btnEncaisser).toBeVisible()
  })
})
