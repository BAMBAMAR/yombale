// setup.js — Prépare la DB de test avant les tests d'intégration
const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL_TEST || ''
const pool = connectionString
  ? new Pool({
      connectionString,
      max: 5,
    })
  : null

beforeAll(async () => {
  if (!pool) {
    console.warn('⚠️ DATABASE_URL_TEST non défini — setup DB de test ignoré')
    return
  }
  try {
    // Vérifier la connexion
    await pool.query('SELECT 1')
    console.log('✅ DB de test connectée')

    // Initialiser le schéma de base de données de test de manière idempotente
    const migrateInline = require('../../backend/migrate-inline')
    await migrateInline(connectionString)

    const bcrypt = require('bcryptjs')
    const hash = await bcrypt.hash('TestPassword2026!', 10)

    // Créer les utilisateurs de test de base
    await pool.query(`
      INSERT INTO utilisateurs (id, email, mot_de_passe_hash, nom, role)
      VALUES 
        ('test-user-acheteur', 'acheteur@test-nopalou.com', $1, 'Acheteur Test', 'acheteur'),
        ('test-user-marchand', 'marchand@test-nopalou.com', $1, 'Marchand Test', 'marchand'),
        ('test-user-admin', 'admin@test-nopalou.com', $1, 'Admin Test', 'admin')
      ON CONFLICT (id) DO UPDATE SET mot_de_passe_hash = $1
    `, [hash])

    // Créer la boutique de test de base
    await pool.query(`
      INSERT INTO boutiques (id, utilisateur_id, nom, slug, telephone, actif)
      VALUES ('test-boutique-001', 'test-user-marchand', 'Boutique Test A', 'boutique-test-a', '221770000000', true)
      ON CONFLICT (id) DO NOTHING
    `)

    // Créer le produit de test de base
    await pool.query(`
      INSERT INTO boutique_produits (id, boutique_id, nom, prix, stock_quantite, actif)
      VALUES ('test-produit-001', 'test-boutique-001', 'Produit Test Intégration', 5000, 50, true)
      ON CONFLICT (id) DO NOTHING
    `)
  } catch (err) {
    console.warn('⚠️ Impossible d\'initialiser DATABASE_URL_TEST:', err.message)
  }
})

afterAll(async () => {
  if (!pool) return
  try {
    // Nettoyer les données de test
    await pool.query(`DELETE FROM boutique_produits WHERE id LIKE 'test-%'`)
    await pool.query(`DELETE FROM boutiques WHERE id LIKE 'test-%'`)
    await pool.query(`DELETE FROM utilisateurs WHERE id LIKE 'test-%'`)
    await pool.query(`DELETE FROM commandes_boutique WHERE client_nom LIKE '%[TEST]%'`)
    await pool.query(`DELETE FROM commandes WHERE reference LIKE '%TEST%'`)
    await pool.end()
    console.log('✅ Données de test nettoyées')
  } catch (err) {
    console.warn('⚠️ Erreur lors du nettoyage de la DB de test:', err.message)
  }
})

module.exports = pool
