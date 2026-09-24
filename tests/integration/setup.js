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

    // Créer les données de test de base
    await pool.query(`
      INSERT INTO utilisateurs (id, email, password_hash, nom, prenom, role)
      VALUES 
        ('test-user-acheteur', 'acheteur@test-nopalou.com', '$2b$10$testhashedpwd', 'Test', 'Acheteur', 'acheteur'),
        ('test-user-marchand', 'marchand@test-nopalou.com', '$2b$10$testhashedpwd', 'Test', 'Marchand', 'marchand'),
        ('test-user-admin', 'admin@test-nopalou.com', '$2b$10$testhashedpwd', 'Test', 'Admin', 'admin')
      ON CONFLICT (id) DO NOTHING
    `)
  } catch (err) {
    console.warn('⚠️ Impossible de se connecter à DATABASE_URL_TEST:', err.message)
  }
})

afterAll(async () => {
  if (!pool) return
  try {
    // Nettoyer les données de test
    await pool.query(`DELETE FROM utilisateurs WHERE id LIKE 'test-%'`)
    await pool.query(`DELETE FROM boutiques WHERE id LIKE 'test-%'`)
    await pool.query(`DELETE FROM commandes WHERE client_nom LIKE '%[TEST]%'`)
    await pool.end()
    console.log('✅ Données de test nettoyées')
  } catch (err) {
    console.warn('⚠️ Erreur lors du nettoyage de la DB de test:', err.message)
  }
})

module.exports = pool
