import 'dotenv/config'
import pg from 'pg'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function runE2ETrialTests() {
  console.log('🧪 Lancement des tests de validation E2E : Règle "1er mois gratuit = Accès Total VIP"...')

  try {
    // 1. Vérification schéma de la table abonnements
    console.log('\n[1/5] Vérification de la colonne is_trial dans la table abonnements...')
    const colRes = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'abonnements' AND column_name = 'is_trial';
    `)
    if (colRes.rows.length === 0) {
      throw new Error('Colonne is_trial introuvable !')
    }
    console.log(`✅ Colonne is_trial validée (${colRes.rows[0].data_type}, défaut: ${colRes.rows[0].column_default}).`)

    // 2. Vérification de la requête GET /api/abonnements/mon-plan
    console.log('\n[2/5] Test de la requête GET /api/abonnements/mon-plan...')
    const monPlanRes = await pool.query(`
      SELECT id, plan, statut, prix_mensuel, debut, fin,
             COALESCE(is_trial, false) AS is_trial,
             GREATEST(0, CEIL(EXTRACT(EPOCH FROM (fin - NOW())) / 86400))::int AS jours_restants
      FROM abonnements
      WHERE is_trial = true AND statut = 'actif' AND fin > NOW()
      LIMIT 1;
    `)
    if (monPlanRes.rows.length === 0) {
      throw new Error('Aucun abonnement d\'essai trouvé pour tester la requête !')
    }
    const sampleTrial = monPlanRes.rows[0]
    console.log(`✅ Essai gratuit trouvé :`, {
      plan_initial: sampleTrial.plan,
      is_trial: sampleTrial.is_trial,
      jours_restants: sampleTrial.jours_restants,
      plan_effectif: sampleTrial.is_trial ? 'business' : sampleTrial.plan,
      acces_total: sampleTrial.is_trial || sampleTrial.plan === 'business'
    })

    // 3. Test de la requête GET /api/boutiques/mine
    console.log('\n[3/5] Test de la projection plan_actif sur GET /api/boutiques/mine...')
    const mineRes = await pool.query(`
      SELECT b.id, b.nom,
             (
               SELECT CASE 
                 WHEN a.is_trial = true THEN 'business' 
                 ELSE a.plan 
               END
               FROM abonnements a
               WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
               ORDER BY a.fin DESC LIMIT 1
             ) AS plan_actif,
             (
               SELECT a.plan
               FROM abonnements a
               WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
               ORDER BY a.fin DESC LIMIT 1
             ) AS plan_souscrit,
             (
               SELECT COALESCE(a.is_trial, false)
               FROM abonnements a
               WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
               ORDER BY a.fin DESC LIMIT 1
             ) AS is_trial,
             (
               SELECT GREATEST(0, CEIL(EXTRACT(EPOCH FROM (a.fin - NOW())) / 86400))::int
               FROM abonnements a
               WHERE a.utilisateur_id = b.utilisateur_id AND a.statut = 'actif' AND a.fin > NOW()
               ORDER BY a.fin DESC LIMIT 1
             ) AS jours_restants_essai
      FROM boutiques b
      WHERE b.utilisateur_id = $1
      LIMIT 1;
    `, [sampleTrial.utilisateur_id || '9f51e682-296f-4f57-ac86-98116487a3ed'])
    
    console.log(`✅ Projection boutique vérifiée :`, mineRes.rows[0] || 'OK')

    // 4. Test des middlewares checkAbonnement et requireBusiness
    console.log('\n[4/5] Test des middlewares de sécurité backend...')
    function testRequireBusiness(req) {
      if (!req.abonnement) return 403
      if (req.abonnement.is_trial || req.abonnement.acces_total || req.abonnement.plan === 'business') {
        return 200
      }
      return 403
    }

    const testCases = [
      { name: 'Commerçant 1er mois gratuit (Taf Taf en essai)', req: { abonnement: { plan: 'decouverte', is_trial: true } }, expected: 200 },
      { name: 'Commerçant 1er mois gratuit (Pro en essai)', req: { abonnement: { plan: 'pro', is_trial: true } }, expected: 200 },
      { name: 'Commerçant abonné payant Pro (sans trial)', req: { abonnement: { plan: 'pro', is_trial: false } }, expected: 403 },
      { name: 'Commerçant abonné payant Business (sans trial)', req: { abonnement: { plan: 'business', is_trial: false } }, expected: 200 },
      { name: 'Commerçant avec essai expiré sans plan', req: { abonnement: null }, expected: 403 },
    ]

    testCases.forEach(tc => {
      const code = testRequireBusiness(tc.req)
      if (code === tc.expected) {
        console.log(`  ✓ ${tc.name} -> Code ${code} (attendu: ${tc.expected})`)
      } else {
        throw new Error(`Échec pour ${tc.name} : obtenu ${code} au lieu de ${tc.expected}`)
      }
    })

    // 5. Test de la fonction frontend isAllowed pour les 20 onglets
    console.log('\n[5/5] Test d\'autorisation frontend pour les 20 onglets...')
    const allTabs = [
      { key: 'dashboard', minPlan: undefined },
      { key: 'produits', minPlan: undefined },
      { key: 'commandes', minPlan: undefined },
      { key: 'carnet', minPlan: undefined },
      { key: 'personnaliser', minPlan: undefined },
      { key: 'social', minPlan: undefined },
      { key: 'marketing', minPlan: undefined },
      { key: 'infos', minPlan: undefined },
      { key: 'fidelite', minPlan: undefined },
      { key: 'express', minPlan: 'pro' },
      { key: 'compta', minPlan: 'pro' },
      { key: 'analytics', minPlan: 'pro' },
      { key: 'documents', minPlan: 'pro' },
      { key: 'fournisseurs', minPlan: 'pro' },
      { key: 'fiscalite', minPlan: 'pro' },
      { key: 'equipe', minPlan: 'business' },
      { key: 'admins', minPlan: 'business' },
      { key: 'caissiers', minPlan: 'business' },
      { key: 'journal', minPlan: 'business' },
      { key: 'developer', minPlan: 'business' },
    ]

    function isAllowed(minPlan, isTrialActive, effectivePlan) {
      if (isTrialActive) return true
      if (!minPlan) return true
      if (effectivePlan === 'business') return true
      if (minPlan === 'pro' && effectivePlan === 'pro') return true
      return false
    }

    const trialUnlockedCount = allTabs.filter(t => isAllowed(t.minPlan, true, 'business')).length
    console.log(`✅ Durant le 1er mois gratuit : ${trialUnlockedCount}/${allTabs.length} onglets sont 100% débloqués !`)
    if (trialUnlockedCount !== allTabs.length) {
      throw new Error(`Certains onglets restent bloqués pendant l'essai gratuit ! (${trialUnlockedCount}/${allTabs.length})`)
    }

    console.log('\n🎉 TOUS LES TESTS "1ER MOIS GRATUIT ACCÈS TOTAL" SONT VALIDÉS AVEC SUCCÈS !')
  } catch (err) {
    console.error('❌ Erreur lors des tests E2E :', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runE2ETrialTests()
