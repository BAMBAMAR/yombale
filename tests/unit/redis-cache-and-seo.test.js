// tests/unit/redis-cache-and-seo.test.js
const { cacheGet, cacheSet, cacheInvalidatePattern, cacheFlush } = require('../../backend/services/redis-cache');

describe('📦 Service Redis & In-Memory Cache (Performance & Scale)', () => {
  beforeEach(async () => {
    await cacheFlush();
  });

  test('cacheSet & cacheGet: stocke et récupère correctement les données avec TTL', async () => {
    const key = 'test_key_1';
    const payload = { id: '123', nom: 'Produit Test', prix: 15000 };

    await cacheSet(key, payload, 60);
    const cached = await cacheGet(key);

    expect(cached).toEqual(payload);
  });

  test('cacheGet: retourne null si la clé n existe pas ou a expiré', async () => {
    const cached = await cacheGet('key_inexistante');
    expect(cached).toBeNull();
  });

  test('cacheInvalidatePattern: invalide toutes les clés correspondant à un motif', async () => {
    await cacheSet('cat:boutique_1', [{ id: 'p1' }], 60);
    await cacheSet('cat:boutique_2', [{ id: 'p2' }], 60);
    await cacheSet('autre_cle', { test: true }, 60);

    await cacheInvalidatePattern('cat:');

    const cat1 = await cacheGet('cat:boutique_1');
    const cat2 = await cacheGet('cat:boutique_2');
    const autre = await cacheGet('autre_cle');

    expect(cat1).toBeNull();
    expect(cat2).toBeNull();
    expect(autre).toEqual({ test: true });
  });
});
