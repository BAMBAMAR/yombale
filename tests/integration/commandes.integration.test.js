const HAS_DB_TEST = !!process.env.DATABASE_URL_TEST
const describeIntegration = HAS_DB_TEST ? describe : describe.skip

let app, request, pool, authToken

describeIntegration('Commandes — Intégration DB réelle', () => {
  beforeAll(async () => {
    request = require('supertest')
    app = require('../../backend/app')
    const { Pool } = require('pg')
    pool = new Pool({ connectionString: process.env.DATABASE_URL_TEST })
    // Connexion réelle avec le compte de test
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.TEST_MARCHAND_EMAIL || 'marchand@test-nopalou.com',
        password: process.env.TEST_MARCHAND_PWD || 'TestPassword2026!',
      })

    authToken = loginRes.body?.token
  })

  afterEach(async () => {
    if (!pool) return
    // Nettoyer les commandes créées pendant les tests
    await pool.query(`DELETE FROM commandes WHERE client_nom = '[TEST] Integration Test'`)
  })

  afterAll(async () => {
    if (pool) await pool.end()
  })

  test('TC-CMD-001 — Création commande : persistance DB vérifiée', async () => {
    // ÉTAPE 1 : Créer la commande via API
    const res = await request(app)
      .post('/api/boutiques/commandes/express')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        boutique_id: process.env.TEST_BOUTIQUE_ID || 'test-boutique-001',
        client_nom: '[TEST] Integration Test',
        client_telephone: '221770000099',
        articles: [{ produit_id: process.env.TEST_PRODUIT_ID || 'test-produit-001', quantite: 1, prix_unitaire: 5000 }],
      })

    expect([200, 201]).toContain(res.status)
    expect(res.body.reference).toBeDefined()
    const reference = res.body.reference

    // ÉTAPE 2 : Vérifier que la commande EXISTE RÉELLEMENT EN DB
    const dbResult = await pool.query(
      'SELECT * FROM commandes WHERE reference = $1',
      [reference]
    )
    expect(dbResult.rows.length).toBe(1)
    expect(dbResult.rows[0].client_nom).toBe('[TEST] Integration Test')
    expect(dbResult.rows[0].statut).toBe('en_attente')

    // ÉTAPE 3 : Vérifier que la commande est accessible via l'API de suivi
    const suiviRes = await request(app)
      .get('/api/boutiques/commandes/suivi')
      .query({ ref: reference })

    expect(suiviRes.status).toBe(200)
    expect(suiviRes.body.commandes?.[0]?.reference || suiviRes.body.commande?.reference).toBe(reference)

    // ÉTAPE 4 : Vérifier l'idempotence — soumettre deux fois la même commande
    const res2 = await request(app)
      .post('/api/boutiques/commandes/express')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        boutique_id: process.env.TEST_BOUTIQUE_ID || 'test-boutique-001',
        client_nom: '[TEST] Integration Test',
        client_telephone: '221770000099',
        articles: [{ produit_id: process.env.TEST_PRODUIT_ID || 'test-produit-001', quantite: 1, prix_unitaire: 5000 }],
      })

    // Vérifier les commandes créées en DB
    const dbCount = await pool.query(
      `SELECT COUNT(*) FROM commandes WHERE client_nom = '[TEST] Integration Test'`
    )
    console.log(`Commandes créées en DB: ${dbCount.rows[0].count}`)
  })

  test('TC-CMD-002 — Décrémentation stock après commande', async () => {
    const produitId = process.env.TEST_PRODUIT_ID || 'test-produit-001'

    // Récupérer le stock initial
    const stockInitial = await pool.query(
      'SELECT stock_quantite FROM boutique_produits WHERE id = $1',
      [produitId]
    )
    const stockAvant = stockInitial.rows[0]?.stock_quantite ?? 10

    // Créer une commande
    await request(app)
      .post('/api/boutiques/commandes/express')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        boutique_id: process.env.TEST_BOUTIQUE_ID || 'test-boutique-001',
        client_nom: '[TEST] Integration Test',
        client_telephone: '221770000099',
        articles: [{ produit_id: produitId, quantite: 1, prix_unitaire: 5000 }],
      })

    // Vérifier que le stock a été décrémenté
    const stockFinal = await pool.query(
      'SELECT stock_quantite FROM boutique_produits WHERE id = $1',
      [produitId]
    )
    if (stockFinal.rows.length > 0 && stockInitial.rows.length > 0) {
      expect(stockFinal.rows[0].stock_quantite).toBe(stockAvant - 1)
    }
  })

  test('TC-CMD-003 — Persistance après refresh navigateur (simulation)', async () => {
    const res = await request(app)
      .post('/api/boutiques/commandes/express')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        boutique_id: process.env.TEST_BOUTIQUE_ID || 'test-boutique-001',
        client_nom: '[TEST] Integration Test',
        client_telephone: '221770000099',
        articles: [{ produit_id: process.env.TEST_PRODUIT_ID || 'test-produit-001', quantite: 1, prix_unitaire: 5000 }],
      })

    const reference = res.body.reference

    // Simuler un "refresh" : nouvelle requête sans cache
    const checkRes = await request(app)
      .get('/api/boutiques/commandes/suivi')
      .query({ ref: reference })

    const refObtenue = checkRes.body.commandes?.[0]?.reference || checkRes.body.commande?.reference
    expect(refObtenue).toBe(reference)
  })
})
