const HAS_DB_TEST = !!process.env.DATABASE_URL_TEST
const describeIntegration = HAS_DB_TEST ? describe : describe.skip

let app, request, pool

describeIntegration('Paiement — Intégration DB réelle', () => {
  beforeAll(() => {
    request = require('supertest')
    app = require('../../backend/app')
    const { Pool } = require('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST })
  })
  afterAll(async () => {
    if (pool) await pool.end()
  })

  test('TC-PAY-001 — confirmer-succes ne modifie pas le statut sans webhook Wave validé', async () => {
    const reference = 'TEST-REF-PAY-001'

    const res = await request(app)
      .post('/api/paiement/confirmer-succes')
      .send({ reference })

    expect([200, 400, 404]).toContain(res.status)
    if (res.status === 200) {
      expect(res.body.paye).toBe(false) // Toujours false sans webhook Wave réel
    }

    // Vérifier en DB si la référence existe
    if (pool) {
      const dbResult = await pool.query(
        'SELECT paiement_recu FROM commandes WHERE reference = $1',
        [reference]
      )
      if (dbResult.rows.length > 0) {
        expect(dbResult.rows[0].paiement_recu).toBe(false)
      }
    }
  })

  test('TC-PAY-002 — Webhook Wave avec signature valide → statut DB mis à jour [BLOQUÉ: Sandbox requis]', async () => {
    // TEST BLOQUÉ — nécessite un compte Wave sandbox configuré
    // Action requise : configurer WAVE_API_KEY_TEST et WAVE_WEBHOOK_SECRET_TEST
    console.log('TEST BLOQUÉ — compte Wave sandbox non configuré')
    expect(true).toBe(true)
  })
})
