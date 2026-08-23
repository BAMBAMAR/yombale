// scripts/test-chatbot-boutique.js
const assert = require('node:assert/strict');

// Mock dependencies
const mockDbCalls = [];
let mockQueryResult = { rows: [] };
const mockPool = {
  query: async (sql, params) => {
    mockDbCalls.push({ sql, params });
    if (typeof mockQueryResult === 'function') {
      return mockQueryResult(sql, params);
    }
    return mockQueryResult;
  },
};

const mockWhatsAppCalls = {
  text: [],
  interactive: [],
  buttons3: [],
  product: [],
  menuOuFin: [],
};

const mockWhatsApp = {
  sendWhatsAppText: async (phone, text) => { mockWhatsAppCalls.text.push({ phone, text }); },
  sendWhatsAppInteractive: async (phone, header, body, sections) => { mockWhatsAppCalls.interactive.push({ phone, header, body, sections }); },
  sendWhatsAppButtons3: async (phone, body, buttons) => { mockWhatsAppCalls.buttons3.push({ phone, body, buttons }); },
  sendWhatsAppProduct: async (phone, productId, body) => { mockWhatsAppCalls.product.push({ phone, productId, body }); },
  sendWhatsAppMenuOuFin: async (phone, body) => { mockWhatsAppCalls.menuOuFin.push({ phone, body }); },
  sendWhatsAppButton: async () => {},
  sendWhatsAppCarousel: async () => {},
  sendReadReceipt: async () => {},
  normalisePhone: (p) => String(p).replace(/\D/g, ''),
  ajouterBlacklist: async () => {},
  retirerBlacklist: async () => {},
  estDesinscrit: async () => false,
};

// Replace require cache for testing
require.cache[require.resolve('../backend/models/db')] = {
  exports: { pool: mockPool },
};
require.cache[require.resolve('../backend/services/whatsapp')] = {
  exports: mockWhatsApp,
};

const chatbot = require('../backend/services/whatsapp-chatbot');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}:`, e.message);
  }
}

async function runAsyncTests() {
  console.log('🧪 Test des fonctionnalités WhatsApp Chatbot (Recherche Boutique & Bouton Suivant)...');

  // Test 1: envoyerFicheProduitBoutique inclut toujours le bouton Suivant
  console.log('\n📦 1. Bouton "Suivant" dans la fiche produit boutique');
  mockWhatsAppCalls.buttons3 = [];
  const fakeProduit = { id: 'prod-123', nom: 'Robe Wax', prix: 15000, description: 'Belle robe', stock_quantite: 5 };
  const fakeBoutiqueAvecTel = { id: 'btq-1', nom: 'Dakar Couture', telephone: '771234567', whatsapp: '771234567' };
  
  await chatbot.envoyerFicheProduitBoutique('221770000000', fakeProduit, fakeBoutiqueAvecTel);
  it('envoyerFicheProduitBoutique: inclut le bouton ⏩ Suivant même quand le vendeur a un téléphone', () => {
    assert.equal(mockWhatsAppCalls.buttons3.length, 1);
    const btns = mockWhatsAppCalls.buttons3[0].buttons;
    assert.equal(btns.length, 3);
    assert.equal(btns[0].id, 'commander_prod-123');
    assert.equal(btns[1].id, 'prod_suivant_prod-123');
    assert.equal(btns[1].title, '⏩ Suivant');
    assert.equal(btns[2].id, 'contact_vendeur_prod-123');
  });

  const fakeBoutiqueSansTel = { id: 'btq-2', nom: 'Boutique Sans Tel', telephone: null, whatsapp: null };
  mockWhatsAppCalls.buttons3 = [];
  await chatbot.envoyerFicheProduitBoutique('221770000000', fakeProduit, fakeBoutiqueSansTel);
  it('envoyerFicheProduitBoutique: inclut le bouton ⏩ Suivant quand la boutique n a pas de téléphone', () => {
    assert.equal(mockWhatsAppCalls.buttons3.length, 1);
    const btns = mockWhatsAppCalls.buttons3[0].buttons;
    assert.equal(btns.length, 3);
    assert.equal(btns[0].id, 'commander_prod-123');
    assert.equal(btns[1].id, 'prod_suivant_prod-123');
    assert.equal(btns[2].id, 'boutique_recherche');
  });

  // Test 2: Option "Chercher par nom" présente dans envoyerToutesLesBoutiques
  console.log('\n📦 2. Liste des boutiques avec option de recherche par nom');
  mockWhatsAppCalls.interactive = [];
  mockQueryResult = {
    rows: [
      { id: 'b1', nom: 'Touba Shop', slug: 'touba-shop', categorie: 'Mode', ville: 'Dakar' },
      { id: 'b2', nom: 'Electro Dakar', slug: 'electro-dakar', categorie: 'Tech', ville: 'Dakar' },
    ],
  };

  await chatbot.envoyerToutesLesBoutiques('221770000000');
  it('envoyerToutesLesBoutiques: inclut l option boutique_recherche_nom dans les rangées interactives', () => {
    assert.equal(mockWhatsAppCalls.interactive.length, 1);
    const sections = mockWhatsAppCalls.interactive[0].sections;
    const rows = sections[0].rows;
    const searchRow = rows.find(r => r.id === 'boutique_recherche_nom');
    assert.ok(searchRow, 'boutique_recherche_nom doit être présent');
    assert.equal(searchRow.title, '🔍 Chercher par nom');
  });

  // Test 3: Recherche de boutique par nom avec résultats
  console.log('\n📦 3. Fonction rechercherBoutiquesParNom');
  mockWhatsAppCalls.text = [];
  mockWhatsAppCalls.interactive = [];
  mockQueryResult = {
    rows: [
      { id: 'b1', nom: 'Touba Shop', slug: 'touba-shop', categorie: 'Mode', ville: 'Dakar', description: 'Vêtements' },
      { id: 'b2', nom: 'Touba Electro', slug: 'touba-electro', categorie: 'Tech', ville: 'Touba', description: 'Smartphones' },
    ],
  };

  await chatbot.rechercherBoutiquesParNom('221770000000', 'Touba');
  it('rechercherBoutiquesParNom: renvoie les résultats et le menu interactif', () => {
    assert.ok(mockWhatsAppCalls.text.some(t => t.text.includes('Résultats pour "Touba"') || t.text.includes('Boutiques correspondant à "Touba"')));
    assert.equal(mockWhatsAppCalls.interactive.length, 1);
    const rows = mockWhatsAppCalls.interactive[0].sections[0].rows;
    assert.ok(rows.some(r => r.id === 'boutique_choisie_b1'));
    assert.ok(rows.some(r => r.id === 'boutique_choisie_b2'));
  });

  // Test 4: Recherche de boutique par nom sans résultat
  mockWhatsAppCalls.text = [];
  mockQueryResult = { rows: [] };
  await chatbot.rechercherBoutiquesParNom('221770000000', 'IntrouvableXYZ');
  it('rechercherBoutiquesParNom: affiche un message propre en cas d absence de résultat', () => {
    assert.ok(mockWhatsAppCalls.text.some(t => t.text.includes('Aucune boutique trouvée pour *"IntrouvableXYZ"*')));
  });

  // Test 5: Détection de numéros de téléphone sénégalais
  console.log('\n📦 4. Extraction & Normalisation de numéros de téléphone');
  it('extraireNumeroTelephone: détecte +221771234567', () => {
    const res = chatbot.extraireNumeroTelephone('+221771234567');
    assert.equal(res?.national, '771234567');
    assert.equal(res?.international, '221771234567');
  });
  it('extraireNumeroTelephone: détecte 78 555 44 33 avec espaces', () => {
    const res = chatbot.extraireNumeroTelephone('Mon numéro est le 78 555 44 33');
    assert.equal(res?.national, '785554433');
    assert.equal(res?.international, '221785554433');
  });
  it('extraireNumeroTelephone: détecte 00221761112233', () => {
    const res = chatbot.extraireNumeroTelephone('00221761112233');
    assert.equal(res?.national, '761112233');
  });

  // Test 6: Vérification du Code PIN marchand
  console.log('\n📦 5. Sécurité Code PIN marchand');
  it('verifierCodePin: accepte le code PIN par défaut (1234) si non défini', async () => {
    const ok = await chatbot.verifierCodePin({ id: 'bq-1', code_pin: null }, '1234');
    assert.equal(ok, true);
  });
  it('verifierCodePin: accepte le code PIN personnalisé (5678)', async () => {
    const ok = await chatbot.verifierCodePin({ id: 'bq-1', code_pin: '5678' }, '5678');
    assert.equal(ok, true);
  });
  it('verifierCodePin: rejette un code PIN incorrect', async () => {
    const ok = await chatbot.verifierCodePin({ id: 'bq-1', code_pin: '5678' }, '0000');
    assert.equal(ok, false);
  });

  // Test 7: Menu Marchand Interactif
  console.log('\n📦 6. Menu Marchand Interactif');
  mockWhatsAppCalls.text = [];
  mockWhatsAppCalls.interactive = [];
  await chatbot.envoyerMenuMarchand('221770000000', { id: 'bq-1', nom: 'Dakar Couture' });
  it('envoyerMenuMarchand: envoie les sections et options marchandes (Ajout, Stock, Caisse, Dettes, Vitrine, PIN)', () => {
    assert.equal(mockWhatsAppCalls.interactive.length, 1);
    const sections = mockWhatsAppCalls.interactive[0].sections;
    const allRows = sections.flatMap(s => s.rows);
    assert.ok(allRows.some(r => r.id === 'marchand_ajout_produit'));
    assert.ok(allRows.some(r => r.id === 'marchand_stock'));
    assert.ok(allRows.some(r => r.id === 'marchand_caisse'));
    assert.ok(allRows.some(r => r.id === 'marchand_dettes'));
    assert.ok(allRows.some(r => r.id === 'marchand_vitrine'));
    assert.ok(allRows.some(r => r.id === 'marchand_changer_pin'));
  });

  // Test 8: Rapport Bilan Caisse Marchand
  console.log('\n📦 7. Rapport Bilan Caisse Marchand du Jour');
  mockWhatsAppCalls.text = [];
  mockQueryResult = {
    rows: [{
      nb_ventes: '3',
      total_ca: '45000',
      ca_wave: '30000',
      ca_om: '10000',
      ca_cash: '5000'
    }]
  };
  await chatbot.envoyerBilanCaisseMarchand('221770000000', { id: 'bq-1', nom: 'Dakar Couture' });
  it('envoyerBilanCaisseMarchand: formate le rapport avec les montants Wave, OM et Cash', () => {
    assert.equal(mockWhatsAppCalls.text.length, 1);
    const msg = mockWhatsAppCalls.text[0].text;
    assert.ok(msg.includes('Bilan Caisse du Jour — Dakar Couture'));
    assert.ok(msg.includes('45\u202F000 FCFA') || msg.includes('45 000 FCFA'));
    assert.ok(msg.includes('Wave'));
  });

  // Test 9: Suivi des Commandes Marchand
  console.log('\n📦 8. Consultation et Suivi des Commandes Marchand');
  mockWhatsAppCalls.text = [];
  mockWhatsAppCalls.buttons3 = [];
  mockQueryResult = {
    rows: [{
      id: 'cmd-999',
      reference: 'CMD-12345',
      nom_produit: 'Robe Bazin',
      quantite: 2,
      prix_unitaire: 15000,
      montant_total: 30000,
      client_nom: 'Fatou Ndiaye',
      client_telephone: '221771234567',
      client_adresse: 'HLM Grand Médine',
      methode_paiement: 'wave',
      statut: 'en_attente',
      created_at: new Date().toISOString()
    }]
  };
  await chatbot.envoyerCommandesMarchand('221770000000', { id: 'bq-1', nom: 'Dakar Couture', slug: 'dakar-couture' });
  it('envoyerCommandesMarchand: affiche la liste des commandes avec détails et boutons d action 1-clic', () => {
    assert.equal(mockWhatsAppCalls.text.length, 1);
    const msg = mockWhatsAppCalls.text[0].text;
    assert.ok(msg.includes('CMD-12345'));
    assert.ok(msg.includes('Fatou Ndiaye'));
    assert.ok(msg.includes('Robe Bazin'));
    assert.ok(msg.includes('30\u202F000 FCFA') || msg.includes('30 000 FCFA'));
    assert.equal(mockWhatsAppCalls.buttons3.length, 1);
    const btns = mockWhatsAppCalls.buttons3[0].buttons;
    assert.ok(btns.some(b => b.id.includes('confirmee')));
  });

  // Test 10: Recherche de Boutique par Numéro de Téléphone
  console.log('\n📦 9. Recherche de Boutique par Téléphone dans le Chat');
  mockWhatsAppCalls.text = [];
  mockWhatsAppCalls.interactive = [];
  mockQueryResult = {
    rows: [{
      id: 'bq-tel-1',
      nom: 'Amar Store',
      slug: 'amar-store',
      categorie: 'High-Tech',
      ville: 'Dakar',
      telephone: '+221 77 720 20 86',
      whatsapp: '777202086'
    }]
  };
  await chatbot.rechercherBoutiquesParNom('221770000000', '777202086');
  it('rechercherBoutiquesParNom: trouve directement la boutique lors de la saisie d un numéro de téléphone', () => {
    assert.ok(mockWhatsAppCalls.text.some(t => t.text.includes('Amar Store')));
  });

  console.log('\n──────────────────────────────────────────────────────────');
  console.log(`Résultats: ${passed} passés, ${failed} échoués (Total: ${passed + failed})`);
  if (failed > 0) process.exit(1);
  console.log('🎉 100% des tests de fonctionnalités chatbot sont validés avec succès !');
  process.exit(0);
}

runAsyncTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});

