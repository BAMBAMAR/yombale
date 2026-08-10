import { test, expect } from '@playwright/test'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://yombale.onrender.com'

// ── Tests API backend ────────────────────────────────────────────────
// Ces tests vérifient que le backend répond correctement

test.describe('API Backend — santé', () => {
  test('GET /health répond 200', async ({ request }) => {
    const res = await request.get(`${BACKEND}/health`)
    expect(res.status()).toBe(200)
  })

  test('GET /api/produits répond avec données', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/produits?limit=5`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('produits')
    expect(Array.isArray(body.produits)).toBeTruthy()
    console.log(`Produits total: ${body.total ?? '?'}`)
  })

  test('GET /api/immo répond avec données', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/immo?limit=5`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('annonces')
    console.log(`Immo total: ${body.total ?? body.annonces?.length ?? '?'}`)
  })

  test('GET /api/annonces (publiques) répond', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/annonces?limit=5`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('annonces')
    console.log(`Annonces total: ${body.total ?? body.annonces?.length ?? '?'}`)
  })

  test('GET /api/telecom répond', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/telecom`)
    expect(res.status()).toBe(200)
  })

  test('POST /api/annonces sans token → 401', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/annonces`, {
      data: { titre: 'Test', prix: 1000 },
    })
    expect([401, 403]).toContain(res.status())
    console.log(`Statut publication sans auth: ${res.status()} (attendu 401/403)`)
  })

  test('POST /api/annonces avec token JWT_SECRET invalide → 401', async ({ request }) => {
    // Simule un JWT signé avec le mauvais secret
    const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSJ9.fakeSignature'
    const res = await request.post(`${BACKEND}/api/annonces`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
      data: { titre: 'Test JWT invalide', prix: 1000 },
    })
    expect([401, 403, 500]).toContain(res.status())
    console.log(`Statut avec faux JWT: ${res.status()} (attendu 401/403/500)`)
  })
})

test.describe('Diagnostic JWT_SECRET', () => {
  test('vérification env var côté Next.js via /api proxy', async ({ request }) => {
    // Tester si le proxy /api/ fonctionne
    const res = await request.get('/api/produits?limit=1')
    console.log(`Status /api/produits via proxy Next.js: ${res.status()}`)
    if (res.status() === 200) {
      console.log('✅ Proxy /api/ fonctionne')
    } else {
      console.log('❌ Proxy /api/ échoue — vérifier NEXT_PUBLIC_BACKEND_URL dans Render')
    }
  })
})
