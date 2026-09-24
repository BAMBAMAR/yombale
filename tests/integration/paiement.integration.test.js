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

  test('TC-PAY-002 — Webhook Wave avec signature HMAC valide → statut commandes_boutique mis à jour en payé', async () => {
    const crypto = require('crypto')
    const secret = process.env.WAVE_WEBHOOK_SECRET || process.env.WAVE_WEBHOOK_SECRET_TEST || 'test-wave-webhook-secret-ci'
    process.env.WAVE_WEBHOOK_SECRET = secret

    const ref = 'TEST-REF-WAVE-002'
    // Créer la commande en attente dans commandes_boutique
    await pool.query(`
      INSERT INTO commandes_boutique (
        reference, boutique_id, nom_produit, quantite, prix_unitaire, montant_total,
        client_nom, client_telephone, statut, paiement_recu, created_at
      ) VALUES (
        $1, 'test-boutique-001', 'Produit Wave Test', 1, 15000, 15000,
        'Client Test Wave', '221770000001', 'en_attente', false, NOW()
      ) ON CONFLICT (reference) DO UPDATE SET statut = 'en_attente', paiement_recu = false
    `, [ref])

    const rawPayload = JSON.stringify({
      type: 'checkout.session.completed',
      data: {
        client_reference: ref,
        amount: 15000,
        customer_phone: '221770000001',
      },
    })

    const timestamp = Math.floor(Date.now() / 1000)
    const hmacSig = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}${rawPayload}`)
      .digest('hex')

    const res = await request(app)
      .post('/api/paiement/wave/webhook')
      .set('wave-signature', `t=${timestamp},v1=${hmacSig}`)
      .set('Content-Type', 'application/json')
      .send(rawPayload)

    expect(res.status).toBe(200)

    // Vérifier l'impact réel et persistant en base de données
    const dbRes = await pool.query(
      'SELECT statut, paiement_recu FROM commandes_boutique WHERE reference = $1',
      [ref]
    )
    expect(dbRes.rows.length).toBe(1)
    expect(dbRes.rows[0].paiement_recu).toBe(true)
    expect(dbRes.rows[0].statut).toBe('payee')
  })

  test('TC-PAY-003 — Webhook Wave avec signature falsifiée ou expirée → rejet strict 401', async () => {
    const rawPayload = JSON.stringify({
      type: 'checkout.session.completed',
      data: { client_reference: 'TEST-REF-FAKE', amount: 10000 },
    })

    const res = await request(app)
      .post('/api/paiement/wave/webhook')
      .set('wave-signature', 't=1600000000,v1=falsified_signature_hex')
      .set('Content-Type', 'application/json')
      .send(rawPayload)

    expect(res.status).toBe(401)
  })
})
