// scripts/test-chatbot-fast.js
const assert = require('assert/strict');

const {
  detecterIntentionInterrogative,
  extraireInfosProduitTexte,
  extraireNumeroTelephone,
} = require('../backend/services/whatsapp-chatbot');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

console.log('🧪 Tests de robustesse du Chatbot WhatsApp...\n');

console.log('1. Détection des intentions interrogatives (Anti-rupture tunnel commande)');
it('détecte un point d interrogation classique et arabe', () => {
  assert.equal(detecterIntentionInterrogative('vous livrez ?'), true);
  assert.equal(detecterIntentionInterrogative('c est disponible ؟'), true);
});

it('détecte les questions sur la livraison et le stock', () => {
  assert.equal(detecterIntentionInterrogative('est ce que vous livrez a ouakam'), true);
  assert.equal(detecterIntentionInterrogative('combien coute la livraison'), true);
  assert.equal(detecterIntentionInterrogative('disponible en taille 42'), true);
  assert.equal(detecterIntentionInterrogative('amna couleur noir'), true);
  assert.equal(detecterIntentionInterrogative('naata la'), true);
});

it('laisse passer les noms et adresses de livraison valides', () => {
  assert.equal(detecterIntentionInterrogative('Bamba Mar, Sacre-Coeur 3'), false);
  assert.equal(detecterIntentionInterrogative('Fatou Diop, Maristes'), false);
  assert.equal(detecterIntentionInterrogative('Alioune Ndiaye, Rue 10 Medina Dakar'), false);
});

console.log('\n2. Extraction des informations produits (Nom, Prix, Stock)');
it('extrait format direct [Nom] [Prix] [Stock]', () => {
  const res = extraireInfosProduitTexte('Sac cuir 5000 10');
  assert.deepEqual(res, { nom: 'Sac cuir', prix: 5000, stock: 10 });
});

it('extrait format avec devise et stock explicite', () => {
  const res = extraireInfosProduitTexte('Robe Bazin 15000 FCFA stock: 5');
  assert.deepEqual(res, { nom: 'Robe Bazin', prix: 15000, stock: 5 });
});

console.log('\n3. Extraction des numéros sénégalais');
it('extrait le format national à 9 chiffres et international', () => {
  const res = extraireNumeroTelephone('+221 77 720 20 86');
  assert.equal(res.national, '777202086');
  assert.equal(res.international, '221777202086');
});

console.log(`\n🎉 Résultat des tests : ${passed} réussis, ${failed} échoués.\n`);
process.exit(failed > 0 ? 1 : 0);
