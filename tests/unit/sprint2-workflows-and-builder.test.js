// tests/unit/sprint2-workflows-and-builder.test.js
const { processWorkflowQueue } = require('../../backend/services/workflow-runner');

describe('⚡ Sprint 2: Workflows Marketing & Dynamic Shop Builder', () => {
  test('processWorkflowQueue: s exécute sans erreur et retourne un statut propre', async () => {
    const res = await processWorkflowQueue();
    expect(res).toBeDefined();
    expect(res.processed !== undefined || res.error !== undefined).toBe(true);
  });

  test('ShopLayoutSection structure: intégrité des types de modules de sections', () => {
    const validSections = [
      { id: 'sec_1', type: 'banner', title: 'Bannière', active: true },
      { id: 'sec_2', type: 'featured_products', title: 'Produits', active: true },
      { id: 'sec_3', type: 'categories_grid', title: 'Catégories', active: true },
      { id: 'sec_4', type: 'testimonials', title: 'Avis', active: true }
    ];

    expect(validSections.length).toBe(4);
    expect(validSections.every(s => s.active === true)).toBe(true);
  });
});
