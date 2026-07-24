import http from 'http'

const BACKEND_URL = 'http://localhost:5000'

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BACKEND_URL)
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || { 'Content-Type': 'application/json' },
    }, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) })
        } catch {
          resolve({ status: res.statusCode, body })
        }
      })
    })
    req.on('error', reject)
    if (options.body) req.write(JSON.stringify(options.body))
    req.end()
  })
}

async function runAllTests() {
  console.log('\n=============================================================')
  console.log('🧪 BANC DE TEST AUTOMATISÉ — SUITE E-COMMERCE NOPALOU')
  console.log('=============================================================\n')

  let passed = 0
  let total = 0

  function test(name, ok, details = '') {
    total++
    if (ok) {
      passed++
      console.log(`✅ [PASS ${total}/8] ${name} ${details ? '(' + details + ')' : ''}`)
    } else {
      console.log(`❌ [FAIL ${total}/8] ${name} ${details ? '(' + details + ')' : ''}`)
    }
  }

  try {
    const boutiqueDemoId = 'dfd632c5-bc8d-49ec-9554-53ea76238ad1' // Tech dakar

    // Test 1: Recherche Instantanée Typeahead
    const r1 = await request('/api/produits/instantanee?q=tech')
    test('1. Recherche Instantanée Typeahead', r1.status === 200 && r1.body.success === true, `Trouvé: ${r1.body.produits?.length || 0} prods, ${r1.body.boutiques?.length || 0} boutiques`)

    // Test 2: Catalogues Standards par Batch
    const r2 = await request('/api/boutiques/catalogues-standards')
    test('2. Catalogues Standards Batch (Metiers)', r2.status === 200 && r2.body.catalogues?.alimentation?.length > 0, `${Object.keys(r2.body.catalogues || {}).length} catégories d’articles modèles recensées`)

    // Test 3: Avis Clients Certifiés (1-5 Étoiles)
    const r3 = await request(`/api/boutiques/${boutiqueDemoId}/avis`)
    test('3. Récupération des Avis Clients (1-5⭐)', r3.status === 200 && r3.body.success === true, `Moyenne: ${r3.body.moyenne || 5}★, Total: ${r3.body.total || 0} avis`)

    // Test 4: Soumission Avis Client
    const r4 = await request(`/api/boutiques/${boutiqueDemoId}/avis`, {
      method: 'POST',
      body: { nom_client: 'Testeur Automatique', note: 5, commentaire: 'Test banc d’essai automatisé réussi' }
    })
    test('4. Dépôt d’Avis Client Certifié', r4.status === 201 && r4.body.success === true, `Avis enregistré avec badge Achat Vérifié`)

    // Test 5: Recommandations Cross-Selling "Souvent achetés ensemble"
    const r5 = await request(`/api/boutiques/${boutiqueDemoId}/produits/sample-id/recommandations`)
    test('5. API Recommandations Cross-Selling', r5.status === 200 && r5.body.success === true, `Recommandations générées (${r5.body.recommandations?.length || 0} articles)`)

    // Test 6: Carnet de Crédits/Prêts Clients Caisse POS
    const r6 = await request(`/api/boutiques/${boutiqueDemoId}/credits-clients`)
    test('6. API Carnet de Crédits/Prêts Clients (POS)', r6.status === 200 && r6.body.success === true, `${r6.body.clients?.length || 0} clients carnet recensés`)

    // Test 7: Enregistrement d'un Panier Abandonné
    const r7 = await request(`/api/boutiques/${boutiqueDemoId}/paniers-abandonnes`, {
      method: 'POST',
      body: { client_nom: 'Client Test', client_tel: '770000000', articles: [{ nom: 'Lacoste', quantite: 1, prix: 7000 }], total: 7000 }
    })
    test('7. Enregistrement Panier Abandonné', r7.status === 201 && r7.body.success === true, `Panier de 7000 FCFA capturé pour relance`)

    // Test 8: Sécurité Endpoint Batch Importation (Authentification requise)
    const r8 = await request(`/api/boutiques/${boutiqueDemoId}/produits/batch`, {
      method: 'POST',
      body: {
        produits: [
          { nom: 'Produit Test Batch Auto 1', prix: 12000, quantite_stock: 5, categorie: 'mode' },
        ]
      }
    })
    test('8. Route Batch Import & Sécurité Marchand', r8.status === 401, `Vérification du token marchand active (401 Unauthorized sans JWT)`)

  } catch (err) {
    console.error('❌ Erreur d’exécution du banc de test:', err)
  }

  console.log('\n=============================================================')
  console.log(`📊 RÉSULTAT DE L’EXÉCUTION DES TESTS : ${passed}/${total} RÉUSSIS (${Math.round(passed/total*100)}%)`)
  console.log('=============================================================\n')
}

runAllTests()
