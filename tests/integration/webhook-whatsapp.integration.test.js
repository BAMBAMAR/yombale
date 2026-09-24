const request = require('supertest')
const crypto = require('crypto')
const app = require('../../backend/app')

describe('Webhook WhatsApp — Sécurité et handshake Meta', () => {
  const TEST_SECRET = 'test-whatsapp-app-secret-32-bytes'
  const TEST_VERIFY_TOKEN = 'test-token-meta-verification'
  let origSecret, origVerifyToken

  beforeAll(() => {
    origSecret = process.env.WHATSAPP_APP_SECRET
    origVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN
    process.env.WHATSAPP_APP_SECRET = TEST_SECRET
    process.env.WHATSAPP_VERIFY_TOKEN = TEST_VERIFY_TOKEN
  })

  afterAll(() => {
    process.env.WHATSAPP_APP_SECRET = origSecret
    process.env.WHATSAPP_VERIFY_TOKEN = origVerifyToken
  })

  // ── Handshake GET (Vérification webhook par Meta) ───────────────────────────
  test('TC-WH-001 — Handshake GET avec bon verify_token retourne le challenge (200)', async () => {
    const res = await request(app)
      .get('/api/whatsapp/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': TEST_VERIFY_TOKEN,
        'hub.challenge': '1234567890',
      })

    expect(res.status).toBe(200)
    expect(res.text).toBe('1234567890')
  })

  test('TC-WH-002 — Handshake GET avec mauvais verify_token est rejeté (403)', async () => {
    const res = await request(app)
      .get('/api/whatsapp/webhook')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong-token',
        'hub.challenge': '1234567890',
      })

    expect(res.status).toBe(403)
  })

  // ── Réception POST (Messages entrants) ──────────────────────────────────────
  test('TC-WH-003 — POST Webhook sans signature x-hub-signature-256 est rejeté (403)', async () => {
    const res = await request(app)
      .post('/api/whatsapp/webhook')
      .send({ entry: [] })

    expect(res.status).toBe(403)
  })

  test('TC-WH-004 — POST Webhook avec signature invalide est rejeté (403)', async () => {
    const res = await request(app)
      .post('/api/whatsapp/webhook')
      .set('x-hub-signature-256', 'sha256=0000000000000000000000000000000000000000000000000000000000000000')
      .send({ entry: [] })

    expect(res.status).toBe(403)
  })

  test('TC-WH-005 — POST Webhook avec signature HMAC valide est accepté (200)', async () => {
    const payload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                messages: [
                  {
                    id: 'test-webhook-msg-001',
                    from: '221770099999',
                    type: 'text',
                    text: { body: 'test webhook' },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    })

    const signature =
      'sha256=' +
      crypto
        .createHmac('sha256', TEST_SECRET)
        .update(payload)
        .digest('hex')

    const res = await request(app)
      .post('/api/whatsapp/webhook')
      .set('x-hub-signature-256', signature)
      .set('Content-Type', 'application/json')
      .send(payload)

    expect(res.status).toBe(200)
  })
})
