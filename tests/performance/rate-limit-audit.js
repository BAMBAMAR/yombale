// tests/performance/rate-limit-audit.js
// Audit du comportement du rate limiter Express pour quantifier le seuil de déclenchement HTTP 429
// Exécuter : node tests/performance/rate-limit-audit.js

const axios = require('axios')

async function auditerRateLimit() {
  const BASE_URL = process.env.BASE_URL || process.env.BACKEND_URL || 'http://localhost:3000'
  const results = { success: 0, rateLimit: 0, errors: 0 }

  console.log(`[AUDIT RATE LIMIT] Début du test sur ${BASE_URL}/api/produits...`)

  for (let i = 0; i < 50; i++) {
    try {
      const res = await axios.get(`${BASE_URL}/api/produits?limit=1`, { timeout: 5000 })
      if (res.status === 200) results.success++
    } catch (err) {
      if (err.response?.status === 429) {
        results.rateLimit++
        console.log(`[429] Rate limit atteint à la requête #${i + 1}`)
      } else {
        results.errors++
        console.warn(`[ERR] Requête #${i + 1} échouée :`, err.message)
      }
    }
    await new Promise((r) => setTimeout(r, 100))
  }

  console.log('[AUDIT RATE LIMIT] Résultats finaux :', results)
  console.log(`[AUDIT RATE LIMIT] Succès: ${results.success} / 50 | 429: ${results.rateLimit} | Erreurs: ${results.errors}`)
  return results
}

if (require.main === module) {
  auditerRateLimit()
}

module.exports = { auditerRateLimit }
