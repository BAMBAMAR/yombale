jest.mock('../../backend/models/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({
      rows: [{ type: 'produit', id: 'p1', titre: 'iPhone 13', prix: 250000, photo: 'https://x/i.jpg', boutique_slug: 'techdakar', boutique_nom: 'Boutique TechDakar', ville: null }],
    }),
  },
}));
jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText: jest.fn().mockResolvedValue({}),
  sendWhatsAppProduct: jest.fn().mockRejectedValue(new Error('no catalog')), // force le fallback texte
  sendReadReceipt: jest.fn().mockResolvedValue({}),
  sendWhatsAppCarousel: jest.fn().mockResolvedValue({}),
  sendWhatsAppInteractive: jest.fn().mockResolvedValue({}),
  sendWhatsAppButton: jest.fn().mockResolvedValue({}),
  sendWhatsAppMenuOuFin: jest.fn().mockResolvedValue({}),
  normalisePhone: jest.fn(p => p),
  sendTyping: jest.fn().mockResolvedValue({}),
}));

const { sendWhatsAppText } = require('../../backend/services/whatsapp');
const { handleSearchQuery } = require('../../backend/services/whatsapp-chatbot');

describe('handleSearchQuery — fallback texte produit boutique', () => {
  it('inclut le nom de la boutique dans le message de secours', async () => {
    await handleSearchQuery('+221700000000', 'iphone');
    const appel = sendWhatsAppText.mock.calls.find(c => c[1].includes('iPhone 13'));
    expect(appel).toBeDefined();
    expect(appel[1]).toContain('Boutique TechDakar');
  });
});
