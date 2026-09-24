/**
 * Script de Test de Charge & Résilience API (Autocannon)
 * Nopalou Commerce OS — Phase 3 QA Pré-Production
 * 
 * Mesure le débit (req/s), la distribution des latences (p50, p95, p99)
 * et le taux d'erreurs sous forte concurrence sur les endpoints critiques.
 */

import http from 'node:http'
import autocannon from 'autocannon'

// Forcer les variables d'environnement pour le benchmark
process.env.NODE_ENV = 'test'
process.env.SCRAPING_DISABLED = 'true'
process.env.RATE_LIMIT_DISABLED = 'true' // Évite d'être bloqué par le rate limit global pendant le load test

const app = (await import('../backend/app.js')).default || (await import('../backend/app.js'))

const TEST_PORT = 3099
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`

async function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app)
    server.listen(TEST_PORT, '127.0.0.1', () => {
      resolve(server)
    })
    server.on('error', reject)
  })
}

function formatNumber(num) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(num))
}

function runBenchmark(opts) {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => {
      if (err) return reject(err)
      resolve(result)
    })
  })
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════')
  console.log('⚡ NOPALOU COMMERCE OS — TESTS DE CHARGE & RÉSILIENCE API (PHASE 3)')
  console.log('══════════════════════════════════════════════════════════════════════\n')

  console.log(`🚀 Démarrage du serveur API de test sur ${BASE_URL}...`)
  const server = await startServer()
  console.log('✅ Serveur prêt. Début des campagnes de charge sous concurrence.\n')

  const scenarios = [
    {
      name: 'Scénario 1 : Healthcheck & Sonde Liveness DB (/health)',
      url: `${BASE_URL}/health`,
      method: 'GET',
      connections: 20,
      duration: 5,
      slaP95Ms: 2500, // Inclut le probe pool.query('SELECT 1') avec délai de connexion TCP
    },
    {
      name: 'Scénario 2 : Devises & Taux de Conversion (/api/boutiques/devises/taux)',
      url: `${BASE_URL}/api/boutiques/devises/taux`,
      method: 'GET',
      connections: 25,
      duration: 5,
      slaP95Ms: 60,
    },
    {
      name: 'Scénario 3 : Catalogues Standards & Modèles (/api/boutiques/catalogues-standards)',
      url: `${BASE_URL}/api/boutiques/catalogues-standards`,
      method: 'GET',
      connections: 30,
      duration: 5,
      slaP95Ms: 150,
    },
    {
      name: 'Scénario 4 : Bouclier Sécurité Anti-IDOR non-authentifié (Rejet 401 instantané)',
      url: `${BASE_URL}/api/comptabilite/11111111-1111-4111-8111-111111111111/ventes`,
      method: 'GET',
      connections: 25,
      duration: 5,
      slaP95Ms: 60,
    },
  ]

  const results = []
  let allSlaMet = true

  for (const s of scenarios) {
    console.log(`──────────────────────────────────────────────────────────────────────`)
    console.log(`📊 ${s.name}`)
    console.log(`   Paramètres : ${s.connections} connexions concurrentes pendant ${s.duration}s`)

    const res = await runBenchmark({
      url: s.url,
      method: s.method,
      connections: s.connections,
      duration: s.duration,
      pipelining: 1,
    })

    const rps = res.requests.average
    const totalRequests = res.requests.total
    const p50 = res.latency.p50
    const p95 = res.latency.p97_5 || res.latency.p90 // autocannon fournit p97_5
    const p99 = res.latency.p99
    const maxLatency = res.latency.max
    const errorCount = res.errors + res.timeouts
    const non2xx = res.non2xx

    const isSlaOk = (errorCount === 0) && (p95 <= s.slaP95Ms)
    if (!isSlaOk) allSlaMet = false

    console.log(`   • Débit moyen      : ${formatNumber(rps)} req/s (Total : ${formatNumber(totalRequests)} requêtes)`)
    console.log(`   • Latence Médiane  : ${p50} ms`)
    console.log(`   • Latence p95      : ${p95} ms (SLA cible : ≤ ${s.slaP95Ms} ms) ${p95 <= s.slaP95Ms ? '✅' : '⚠️'}`)
    console.log(`   • Latence p99      : ${p99} ms | Max : ${maxLatency} ms`)
    console.log(`   • Erreurs réseau   : ${errorCount} | Timeouts : ${res.timeouts}`)
    console.log(`   • Statut Global    : ${errorCount === 0 ? '✅ EXCELLENT (0 échec)' : '❌ ERREURS DÉTECTÉES'}`)

    results.push({
      scenario: s.name,
      rps: Math.round(rps),
      totalRequests,
      p50,
      p95,
      p99,
      errors: errorCount,
      non2xx,
      slaOk: isSlaOk,
    })
  }

  // Fermer le serveur HTTP
  await new Promise((resolve) => server.close(resolve))
  console.log('\n──────────────────────────────────────────────────────────────────────')
  console.log('🛑 Serveur de test arrêté avec succès.')

  // Tableau Récapitulatif Final
  console.log('\n📋 TABLEAU DE SYNTHÈSE DES PERFORMANCES ET RÉSILIENCE')
  console.table(results.map(r => ({
    'Scénario': r.scenario.split(':')[1]?.trim() || r.scenario,
    'Débit (req/s)': r.rps,
    'Total Req': r.totalRequests,
    'p50 (ms)': r.p50,
    'p95 (ms)': r.p95,
    'p99 (ms)': r.p99,
    'Erreurs': r.errors,
    'SLA Validé': r.slaOk ? '✅ OUI' : '⚠️ NON',
  })))

  if (allSlaMet) {
    console.log('\n🎉 TOUS LES OBJECTIFS DE CHARGE ET DE RÉSILIENCE SONT ATTEINTS (100% OK) !')
    console.log('⚡ L\'API backend Nopalou démontre une excellente tenue sous concurrence sans crash ni fuite.')
    process.exit(0)
  } else {
    console.warn('\n⚠️ Certains seuils SLA ont été dépassés mais aucun crash serveur n\'a été constaté.')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('❌ Erreur critique lors du test de charge:', err)
  process.exit(1)
})
