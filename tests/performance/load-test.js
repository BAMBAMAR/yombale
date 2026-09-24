// Exécuter : k6 run tests/performance/load-test.js
// Documentation k6 : https://k6.io/docs/getting-started/installation/

import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Montée progressive à 10 utilisateurs
    { duration: '1m', target: 10 },  // Maintien à 10 utilisateurs
    { duration: '30s', target: 0 },  // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% des requêtes < 2s (SLA)
    http_req_failed: ['rate<0.01'],    // Moins de 1% d'erreurs
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

export default function () {
  // Test 1 — Page d'accueil
  let res = http.get(`${BASE_URL}/`)
  check(res, { 'Accueil → 200': (r) => r.status === 200 })

  // Test 2 — API produits
  res = http.get(`${BASE_URL}/api/produits?limit=10`)
  check(res, {
    'API produits → 200': (r) => r.status === 200,
    'API produits < 1s': (r) => r.timings.duration < 1000,
  })

  // Test 3 — API immobilier
  res = http.get(`${BASE_URL}/api/immo?limit=10`)
  check(res, { 'API immo → 200': (r) => r.status === 200 })

  // Test 4 — Recherche comparateur
  res = http.get(`${BASE_URL}/api/produits?q=Samsung&limit=10`)
  check(res, { 'Recherche → 200': (r) => r.status === 200 })

  sleep(1)
}
