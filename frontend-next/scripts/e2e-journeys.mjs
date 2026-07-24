import http from 'http';

const BACKEND_URL = 'http://127.0.0.1:5000';

async function request(path, options = {}) {
  const url = new URL(path, BACKEND_URL);
  const fetchOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let body;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { status: res.status, body };
}

function assert(condition, message, context = null) {
  if (!condition) {
    if (context) console.error('Contexte:', JSON.stringify(context, null, 2));
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runJourneys() {
  console.log('==================================================');
  console.log('🚀 DÉMARRAGE DES TESTS END-TO-END (API)');
  console.log('==================================================\n');

  try {
    // =========================================================================
    // SCÉNARIO 1 : LE PARCOURS CLIENT
    // =========================================================================
    console.log('--- SCÉNARIO 1 : LE PARCOURS CLIENT ---');
    const clientEmail = `client.${Date.now()}@example.com`;
    const clientPass = 'password123';

    // 1. Inscription
    let res = await request('/api/auth/inscription', {
      method: 'POST',
      body: { nom: 'Client Test', email: clientEmail, mot_de_passe: clientPass }
    });
    assert(res.status === 201, 'Inscription Client réussie', res.body);
    const clientToken = res.body.token;

    // 2. Connexion
    res = await request('/api/auth/connexion', {
      method: 'POST',
      body: { email: clientEmail, mot_de_passe: clientPass }
    });
    assert(res.status === 200, 'Connexion Client réussie', res.body);

    // 3. Recherche de produit
    res = await request('/api/produits/instantanee?q=tech');
    assert(res.status === 200, 'API Recherche instantanée OK', res.body);

    // 4. Consultation des détails d'une boutique (Tech Dakar dfd632c5-bc8d-49ec-9554-53ea76238ad1)
    const boutiqueDemoId = 'dfd632c5-bc8d-49ec-9554-53ea76238ad1';
    res = await request(`/api/boutiques/${boutiqueDemoId}`);
    assert(res.status === 200, 'Consultation Boutique existante OK', res.body);

    // 5. Dépôt d'un avis client
    res = await request(`/api/boutiques/${boutiqueDemoId}/avis`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${clientToken}` },
      body: { nom_client: 'Client Test', note: 4, commentaire: 'Super boutique !' }
    });
    assert(res.status === 201, 'Dépôt d\'avis client OK');


    // =========================================================================
    // SCÉNARIO 2 : LE PARCOURS MARCHAND
    // =========================================================================
    console.log('\n--- SCÉNARIO 2 : LE PARCOURS MARCHAND ---');
    const merchantEmail = `marchand.${Date.now()}@example.com`;
    const merchantPass = 'password123';

    // 1. Inscription
    res = await request('/api/auth/inscription', {
      method: 'POST',
      body: { nom: 'Marchand Test', email: merchantEmail, mot_de_passe: merchantPass }
    });
    assert(res.status === 201, 'Inscription Marchand réussie', res.body);
    const merchantToken = res.body.token;
    const merchantId = res.body.user.id;

    // Simulation: l'utilisateur a cliqué sur le lien de son email
    const { execSync } = await import('child_process');
    execSync(`node ../backend/verify-user.js "${merchantId}"`);




    // 2. Création d'une Boutique
    res = await request('/api/boutiques', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${merchantToken}` },
      body: { 
        nom: 'Boutique Test API', 
        slug: `boutique-test-${Date.now()}`, 
        description: 'Boutique de test E2E', 
        whatsapp: '770000000', 
        categorie: 'mode'
      }
    });
    assert(res.status === 201, 'Création de Boutique réussie', res.body);
    const newBoutiqueId = res.body.boutique.id;
    const newBoutiqueSlug = res.body.boutique.slug;

    // 3. Importation par Lot (Batch)
    const produitsBatch = Array(50).fill(0).map((_, i) => ({
      nom: `Produit Batch ${i}`,
      prix: 1000 + i,
      quantite_stock: 10,
      categorie: 'mode'
    }));

    res = await request(`/api/boutiques/${newBoutiqueId}/produits/batch`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${merchantToken}` },
      body: { produits: produitsBatch }
    });
    assert(res.status === 201, 'Importation par lot (50 produits) OK', res.body);

    // 4. Test dépassement de la limite d'import (51 produits)
    const produitsOverLimit = Array(51).fill(0).map((_, i) => ({ nom: `P${i}`, prix: 1000 }));
    res = await request(`/api/boutiques/${newBoutiqueId}/produits/batch`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${merchantToken}` },
      body: { produits: produitsOverLimit }
    });
    assert(res.status === 400, 'Rejet correct de l\'importation par lot > 50 (limite)');

    // 5. Création d'un Caissier avec le SLUG
    res = await request(`/api/boutiques/${newBoutiqueSlug}/caissiers`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${merchantToken}` },
      body: { nom: 'Caissier 1', code_pin: '1234' }
    });
    assert(res.status === 201, 'Création de Caissier via Slug OK', res.body);
    const caissierId = res.body.caissier.id;

    // 6. Création d'un Administrateur Web
    res = await request(`/api/boutiques/${newBoutiqueId}/admins`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${merchantToken}` },
      body: { email: clientEmail } // On ajoute le client créé plus haut comme admin
    });
    assert(res.status === 201, 'Ajout d\'un Administrateur Web OK');

    // 7. Simulation d'une vente POS (Caisse)
    res = await request(`/api/boutiques/${newBoutiqueId}/pos-vente`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${merchantToken}` },
      body: {
        caissier: 'Caissier 1',
        modePaiement: 'especes',
        items: [{ nom: 'Produit Test', quantite: 2, prix: 5000 }]
      }
    });
    assert(res.status === 201, 'Enregistrement de vente POS OK', res.body);

    console.log('\n🎉 TOUS LES TESTS E2E ONT ÉTÉ PASSÉS AVEC SUCCÈS !');
  } catch (err) {
    console.error(`\n❌ ÉCHEC DES TESTS : ${err.message}`);
    process.exit(1);
  }
}

runJourneys();
