import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function migrate() {
  console.log('🚀 Début de la migration : is_trial sur la table abonnements...')

  try {
    // 1. Ajouter la colonne is_trial si elle n'existe pas
    await pool.query(`
      ALTER TABLE abonnements 
      ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE;
    `)
    console.log('✅ Colonne is_trial ajoutée ou déjà existante.')

    // 2. Créer un index sur is_trial
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_abonnements_is_trial ON abonnements(is_trial) WHERE statut = 'actif';
    `)
    console.log('✅ Index idx_abonnements_is_trial créé.')

    // 3. Marquer rétroactivement les abonnements d'essai actifs
    // Sont considérés comme essai : abonnements actifs sans référence de paiement Wave réelle (ex: null, wa_trial_%, trial_%)
    const updateRes = await pool.query(`
      UPDATE abonnements 
      SET is_trial = TRUE
      WHERE statut = 'actif' 
      AND (commande_ref IS NULL OR commande_ref LIKE 'wa_trial_%' OR commande_ref LIKE 'trial_%' OR prix_mensuel = 2500)
      RETURNING id, plan, commande_ref, fin;
    `)
    console.log(`✅ ${updateRes.rowCount} abonnements actifs identifiés et passés en 'is_trial = TRUE'.`)

    // 4. Vérification
    const verifyRes = await pool.query(`
      SELECT COUNT(*) AS total_essais_actifs
      FROM abonnements 
      WHERE is_trial = TRUE AND statut = 'actif' AND fin > NOW();
    `)
    console.log(`🎉 Total des essais gratuits actifs avec Accès Total VIP : ${verifyRes.rows[0].total_essais_actifs}`)
  } catch (err) {
    console.error('❌ Erreur lors de la migration :', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
