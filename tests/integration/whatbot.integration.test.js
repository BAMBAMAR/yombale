// Tests WhatBot avec DB RÉELLE (quand DATABASE_URL_TEST est configuré)
// Le service WhatsApp externe reste TOUJOURS mocké pour ne JAMAIS envoyer de vrais messages

jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-id' }),
  sendWhatsAppInteractive: jest.fn().mockResolvedValue({}),
  sendWhatsAppButton: jest.fn().mockResolvedValue({}),
  sendWhatsAppButtons3: jest.fn().mockResolvedValue({}),
  sendWhatsAppCarousel: jest.fn().mockResolvedValue({}),
  sendWhatsAppMenuOuFin: jest.fn().mockResolvedValue({}),
  sendReadReceipt: jest.fn().mockResolvedValue({}),
  sendTyping: jest.fn().mockResolvedValue({}),
  normalisePhone: jest.fn((p) => String(p || '').replace(/\D/g, '')),
  estDesinscrit: jest.fn().mockResolvedValue(false),
  ajouterBlacklist: jest.fn().mockResolvedValue({}),
  retirerBlacklist: jest.fn().mockResolvedValue({}),
}))

const { sendWhatsAppText } = require('../../backend/services/whatsapp')

const HAS_DB_TEST = !!process.env.DATABASE_URL_TEST
const describeIntegration = HAS_DB_TEST ? describe : describe.skip

let pool, handleIncoming
const TEST_PHONE = '221770099999'

describeIntegration('WhatBot — Intégration DB Réelle', () => {
  beforeAll(() => {
    const { Pool } = require('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST })
    handleIncoming = require('../../backend/services/whatsapp-chatbot').handleIncoming
  })
  beforeEach(async () => {
    if (!pool) return
    // Nettoyer la session de test avant chaque test
    await pool.query('DELETE FROM whatsapp_sessions WHERE phone = $1', [TEST_PHONE])
    await pool.query('DELETE FROM whatsapp_processed_messages WHERE message_id LIKE $1', ['INT-TEST-%'])
    jest.clearAllMocks()
  })

  afterAll(async () => {
    if (pool) {
      await pool.query('DELETE FROM whatsapp_sessions WHERE phone = $1', [TEST_PHONE])
      await pool.end()
    }
  })

  test('TC-WB-001 — Session créée en DB après premier message', async () => {
    await handleIncoming({
      id: 'INT-TEST-001',
      from: TEST_PHONE,
      type: 'text',
      text: { body: 'Bonjour' },
    })

    const sessionDB = await pool.query(
      'SELECT state, context FROM whatsapp_sessions WHERE phone = $1',
      [TEST_PHONE]
    )
    expect(sessionDB.rows.length).toBe(1)
    console.log('Session DB créée avec état:', sessionDB.rows[0].state)
  })

  test('TC-WB-002 — Message dédupliqué (idempotence webhook)', async () => {
    const msg = {
      id: 'INT-TEST-002-DUP',
      from: TEST_PHONE,
      type: 'text',
      text: { body: 'test déduplication' },
    }

    await handleIncoming(msg)
    await handleIncoming(msg) // Même ID = doublon

    // sendWhatsAppText ne doit avoir été exécuté qu'une fois grâce à la déduplication
    expect(sendWhatsAppText.mock.calls.length).toBeLessThanOrEqual(1)
  })

  test('TC-WB-003 — Historique session conservé entre deux messages', async () => {
    await handleIncoming({
      id: 'INT-TEST-003-A',
      from: TEST_PHONE,
      type: 'text',
      text: { body: '1' },
    })

    const session1 = await pool.query(
      'SELECT state FROM whatsapp_sessions WHERE phone = $1',
      [TEST_PHONE]
    )
    const state1 = session1.rows[0]?.state

    await handleIncoming({
      id: 'INT-TEST-003-B',
      from: TEST_PHONE,
      type: 'text',
      text: { body: 'Samsung' },
    })

    const session2 = await pool.query(
      'SELECT state FROM whatsapp_sessions WHERE phone = $1',
      [TEST_PHONE]
    )
    const state2 = session2.rows[0]?.state

    console.log(`Transitions d'état WhatBot: ${state1} → ${state2}`)
    expect(state2).toBeDefined()
  })

  test('TC-WB-004 — Commande source WhatsApp créée en DB avec référence et calcul exact', async () => {
    const { creerCommandeBoutique } = require('../../backend/services/commande-service')

    // S'assurer qu'une boutique et un produit de test existent
    await pool.query(`
      INSERT INTO boutiques (id, utilisateur_id, nom, slug, telephone, actif)
      VALUES ('wb-test-bq-001', 'test-user-marchand', 'Boutique WhatBot Test', 'boutique-wb-test', '221770000000', true)
      ON CONFLICT (id) DO UPDATE SET nom = EXCLUDED.nom
    `)
    await pool.query(`
      INSERT INTO boutique_produits (id, boutique_id, nom, prix, stock_quantite, actif)
      VALUES ('wb-test-prd-001', 'wb-test-bq-001', 'Article WhatsApp Test', 7500, 10, true)
      ON CONFLICT (id) DO UPDATE SET prix = EXCLUDED.prix
    `)

    const cmd = await creerCommandeBoutique({
      boutiqueId: 'wb-test-bq-001',
      produitId: 'wb-test-prd-001',
      quantite: 2,
      clientNom: 'Client WhatBot Test',
      clientTelephone: TEST_PHONE,
      source: 'whatsapp',
      methodePaiement: 'wave',
    })

    expect(cmd).toBeDefined()
    expect(cmd.reference).toBeDefined()
    expect(cmd.source).toBe('whatsapp')
    expect(Number(cmd.montant_total)).toBe(15000)

    // Vérifier l'écriture directe et persistance en base SQL
    const dbCmd = await pool.query(
      'SELECT reference, source, montant_total, statut FROM commandes_boutique WHERE reference = $1',
      [cmd.reference]
    )
    expect(dbCmd.rows.length).toBe(1)
    expect(dbCmd.rows[0].source).toBe('whatsapp')
    expect(Number(dbCmd.rows[0].montant_total)).toBe(15000)
    expect(dbCmd.rows[0].statut).toBe('en_attente')

    // Nettoyage spécifique
    await pool.query('DELETE FROM commandes_boutique WHERE reference = $1', [cmd.reference])
    await pool.query('DELETE FROM boutique_produits WHERE id = $1', ['wb-test-prd-001'])
    await pool.query('DELETE FROM boutiques WHERE id = $1', ['wb-test-bq-001'])
  })
})
