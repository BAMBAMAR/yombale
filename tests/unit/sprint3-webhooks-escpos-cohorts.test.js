jest.mock('../../backend/models/db', () => ({
  pool: {
    query: jest.fn().mockResolvedValue({ rows: [] })
  },
  query: jest.fn().mockResolvedValue({ rows: [] })
}));

const { generateEscPosReceipt } = require('../../frontend-next/src/lib/pos-escpos-printer');
const { dispatchWebhookEvent } = require('../../backend/services/webhookDispatcher');

describe('⚡ Sprint 3: Webhooks Dispatcher, ESC/POS Binary Printer & Cohorts Matrix', () => {
  test('generateEscPosReceipt: génère un buffer binaire ESC/POS valide avec en-têtes et impulsion tiroir-caisse', () => {
    const receiptData = {
      boutiqueNom: 'Boutique Dakar Pro',
      boutiqueAdresse: 'Sandaga Allée 4',
      boutiqueTel: '771234567',
      referenceTicket: 'TCK-2026-001',
      date: '13/09/2026 23:50',
      articles: [
        { nom: 'Robe Wax', quantite: 2, prixUnitaire: 15000, total: 30000 }
      ],
      totalFCFA: 30000,
      modePaiement: 'Wave',
      messageBasTicket: 'Merci de votre confiance'
    };

    const bytes = generateEscPosReceipt(receiptData, true);

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(50);
    // Vérifier l'impulsion ouverture tiroir-caisse (0x1B 0x70)
    expect(bytes[2]).toBe(0x1b);
    expect(bytes[3]).toBe(0x70);
  });

  test('dispatchWebhookEvent: s exécute sans erreur même sans webhooks actifs', async () => {
    await expect(dispatchWebhookEvent('fake_boutique_id', 'order.created', { test: true })).resolves.not.toThrow();
  });
});
