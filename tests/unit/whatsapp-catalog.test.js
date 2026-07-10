jest.mock('axios');
jest.mock('../../backend/models/db', () => ({ pool: { query: jest.fn().mockResolvedValue({ rows: [] }) } }));

const axios = require('axios');
const { pool } = require('../../backend/models/db');

describe('mapEtatToCondition', () => {
  const { mapEtatToCondition } = require('../../backend/services/whatsapp-catalog');

  it('mappe les 4 valeurs Nopalou vers les valeurs Meta attendues', () => {
    expect(mapEtatToCondition('Neuf')).toBe('new');
    expect(mapEtatToCondition('Bon état')).toBe('used');
    expect(mapEtatToCondition('Occasion')).toBe('used');
    expect(mapEtatToCondition('Pour pièces')).toBe('refurbished');
  });

  it('retombe sur "used" si la valeur est absente ou inconnue', () => {
    expect(mapEtatToCondition(undefined)).toBe('used');
    expect(mapEtatToCondition('valeur-inconnue')).toBe('used');
  });
});

describe('syncProduit', () => {
  const { syncProduit } = require('../../backend/services/whatsapp-catalog');

  beforeEach(() => {
    pool.query.mockClear();
    axios.post.mockClear();
  });

  it('enregistre le statut "echec" si le catalog_id est absent', async () => {
    const produit = { id: 'p1', nom: 'Test', prix: 1000, caracteristiques: {} };
    await syncProduit(produit);
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE boutique_produits SET whatsapp_sync_statut=$1, whatsapp_sync_erreur=$2 WHERE id=$3',
      ['echec', 'WHATSAPP_CATALOG_ID non configuré', 'p1']
    );
  });

  it('enregistre le statut "synchronise" et envoie brand/condition/category/sale_price quand la sync Meta réussit', async () => {
    process.env.WHATSAPP_API_TOKEN = 'test-token';
    process.env.WHATSAPP_CATALOG_ID = 'cat123';
    axios.post.mockResolvedValue({ data: {} });

    const produit = {
      id: 'p2', nom: 'iPhone 13', prix: 250000, prix_barre: 300000,
      categorie: 'smartphones', images: ['https://x/img.jpg'], en_stock: true,
      caracteristiques: { marque: 'Apple', etat: 'Neuf' },
    };
    await syncProduit(produit);

    expect(axios.post).toHaveBeenCalledWith(
      'https://graph.facebook.com/v18.0/cat123/products',
      expect.objectContaining({
        brand: 'Apple',
        condition: 'new',
        category: 'smartphones',
        sale_price: 25000000,
      }),
      expect.anything()
    );
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE boutique_produits SET whatsapp_sync_statut=$1, whatsapp_sync_erreur=$2 WHERE id=$3',
      ['synchronise', null, 'p2']
    );

    delete process.env.WHATSAPP_API_TOKEN;
    delete process.env.WHATSAPP_CATALOG_ID;
  });
});
