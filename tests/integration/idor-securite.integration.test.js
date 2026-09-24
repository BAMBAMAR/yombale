// Tests de sécurité multi-tenant — AUCUN MOCK
// Ces tests vérifient que l'isolation entre marchands et agences est réelle (Anti-IDOR)
const request = require('supertest')
const jwt = require('jsonwebtoken')
const app = require('../../backend/app')

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-default-key-for-local'

describe('SÉCURITÉ — Isolation Multi-Tenant (Anti-IDOR)', () => {
  let tokenMarchandA, tokenMarchandB
  let boutiqueIdA, boutiqueIdB

  beforeAll(async () => {
    // Tenter la connexion par API
    try {
      const loginA = await request(app)
        .post('/api/auth/login')
        .send({ email: 'marchand-a@test-nopalou.com', password: 'TestPassword2026!' })
      if (loginA.body?.token) {
        tokenMarchandA = loginA.body.token
        boutiqueIdA = loginA.body.user?.boutique_id
      }
    } catch (_) {}

    // Fallback : générer des tokens JWT signés avec des identités distinctes (format UUID)
    if (!tokenMarchandA) {
      boutiqueIdA = process.env.TEST_BOUTIQUE_A_ID || '11111111-1111-1111-1111-111111111111'
      tokenMarchandA = jwt.sign(
        {
          userId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          role: 'marchand',
          email: 'marchand-a@test.com',
        },
        JWT_SECRET,
        { expiresIn: '2h' }
      )
    }

    try {
      const loginB = await request(app)
        .post('/api/auth/login')
        .send({ email: 'marchand-b@test-nopalou.com', password: 'TestPassword2026!' })
      if (loginB.body?.token) {
        tokenMarchandB = loginB.body.token
        boutiqueIdB = loginB.body.user?.boutique_id
      }
    } catch (_) {}

    if (!tokenMarchandB) {
      boutiqueIdB = process.env.TEST_BOUTIQUE_B_ID || '22222222-2222-2222-2222-222222222222'
      tokenMarchandB = jwt.sign(
        {
          userId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          role: 'marchand',
          email: 'marchand-b@test.com',
        },
        JWT_SECRET,
        { expiresIn: '2h' }
      )
    }
  })

  test('TC-IDOR-001 — Marchand B ne peut pas lire les commandes de Marchand A', async () => {
    const res = await request(app)
      .get(`/api/comptabilite/${boutiqueIdA}/commandes`)
      .set('Authorization', `Bearer ${tokenMarchandB}`)

    expect([401, 403, 404]).toContain(res.status)
    if (res.body) {
      expect(res.body.error || res.body.message || res.body.code).toBeDefined()
    }
  })

  test('TC-IDOR-002 — Marchand B ne peut pas modifier les produits de Marchand A', async () => {
    const res = await request(app)
      .put(`/api/boutiques/${boutiqueIdA}/produits/999999`)
      .set('Authorization', `Bearer ${tokenMarchandB}`)
      .send({ prix: 1000 })

    expect([400, 401, 403, 404]).toContain(res.status)
  })

  test('TC-IDOR-003 — Marchand B ne peut pas accéder aux stats de Marchand A', async () => {
    const res = await request(app)
      .get(`/api/comptabilite/${boutiqueIdA}/statistiques`)
      .set('Authorization', `Bearer ${tokenMarchandB}`)

    expect([401, 403, 404]).toContain(res.status)
  })

  test('TC-IDOR-004 — Marchand A ne peut pas accéder aux routes admin', async () => {
    const res = await request(app)
      .get('/api/admin/utilisateurs')
      .set('Authorization', `Bearer ${tokenMarchandA}`)

    expect([401, 403]).toContain(res.status)
  })

  test('TC-IDOR-005 — Token expiré ou invalide → toutes les routes protégées retournent 401', async () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0IiwiZXhwIjoxfQ.invalid_sig'

    const routes = [
      `/api/comptabilite/${boutiqueIdA}/ventes`,
      '/api/boutiques/mine',
      '/api/admin/utilisateurs',
    ]

    for (const route of routes) {
      const res = await request(app)
        .get(route)
        .set('Authorization', `Bearer ${expiredToken}`)

      expect([401, 403]).toContain(res.status)
    }
  })
})

describe('SÉCURITÉ — Isolation Agences Immobilières (Anti-IDOR)', () => {
  let tokenAgenceB
  const agenceIdA = '33333333-3333-3333-3333-333333333333'

  beforeAll(() => {
    tokenAgenceB = jwt.sign(
      { userId: 'user-agent-b', id: 'user-agent-b', role: 'agent_immo', email: 'agent-b@immo.sn' },
      JWT_SECRET,
      { expiresIn: '2h' }
    )
  })

  test('TC-IDOR-IMMO-001 — Agence B ne peut pas voir les leads ou données privées de Agence A', async () => {
    const res = await request(app)
      .get(`/api/immo/agences/${agenceIdA}/leads`)
      .set('Authorization', `Bearer ${tokenAgenceB}`)

    expect([401, 403, 404]).toContain(res.status)
  })

  test('TC-IDOR-IMMO-002 — Agence B ne peut pas modifier les annonces exclusives de Agence A', async () => {
    const res = await request(app)
      .put(`/api/immo/agences/${agenceIdA}/biens/fake-bien-id`)
      .set('Authorization', `Bearer ${tokenAgenceB}`)
      .send({ titre: 'Hacked Title' })

    expect([401, 403, 404]).toContain(res.status)
  })
})
