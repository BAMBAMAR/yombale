// tests/unit/chat-api.test.js
// Tests unitaires pour l'API du Chatbot Web Nopalou (POST /api/chat/message)

const request = require('supertest');
const express = require('express');

const mockQuery = jest.fn();
jest.mock('../../backend/models/db', () => ({
  pool: {
    query: mockQuery,
  },
}));

jest.mock('../../backend/middlewares/rateLimit', () => ({
  limiterRecherche: (req, res, next) => next(),
}));

const chatRouter = require('../../backend/routes/chat');

const app = express();
app.use(express.json());
app.use('/api/chat', chatRouter);

describe('POST /api/chat/message — API Chatbot Web Nopalou', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test('renvoie une erreur 400 si le message est vide', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ message: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Message requis');
  });

  test('répond avec les informations FAQ pour les questions de livraison', async () => {
    const res = await request(app)
      .post('/api/chat/message')
      .send({ message: 'Quels sont vos délais de livraison ?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toContain('Nopalou livre partout à Dakar');
    expect(res.body.whatsappUrl).toContain('https://wa.me/221708717942');
  });

  test('détecte l\'intention immobilière et retourne les options de logements', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          type: 'immo',
          id: 'immo-alm-1',
          titre: 'Villa 5 pièces avec piscine',
          prix: 1200000,
          photo: 'https://img.com/villa.jpg',
          ville: 'Almadies',
        },
      ],
    });

    const res = await request(app)
      .post('/api/chat/message')
      .send({ message: 'Je cherche une villa aux Almadies' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].titre).toBe('Villa 5 pièces avec piscine');
    expect(res.body.chips.some(c => c.url === '/immo')).toBe(true);
  });

  test('effectue la correction de fautes et renvoie les produits correspondants', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          type: 'produit',
          id: 'prod-clim-web',
          titre: 'Climatiseur Split 9000 BTU',
          prix: 145000,
          photo: 'https://img.com/split.jpg',
          boutique_nom: 'Dakar Froid',
          boutique_slug: 'dakar-froid',
        },
      ],
    });

    const res = await request(app)
      .post('/api/chat/message')
      .send({ message: 'climatisseur' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.correction).toBe('climatiseur');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].titre).toBe('Climatiseur Split 9000 BTU');
    expect(res.body.items[0].url).toContain('/boutiques/dakar-froid/produits/prod-clim-web');
  });
});
