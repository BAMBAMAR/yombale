// Tests unitaires — services/notifications.js
// Les dépendances IO (email, whatsapp, pool) sont mockées

jest.mock('../../backend/services/email', () => ({
  envoyerEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText:       jest.fn().mockResolvedValue(undefined),
  sendWhatsAppCarousel:   jest.fn().mockResolvedValue(undefined),
  sendWhatsAppTemplate:   jest.fn().mockResolvedValue(undefined),
}));

// Mock pool.query pour UPDATE alertes SET active=false
jest.mock('../../backend/models/db', () => ({
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));

const { envoyerEmail } = require('../../backend/services/email');
const { sendWhatsAppText } = require('../../backend/services/whatsapp');
const { pool } = require('../../backend/models/db');
const { envoyerAlertePrix } = require('../../backend/services/notifications');

beforeEach(() => {
  jest.clearAllMocks();
});

const alerteBase = {
  id: 'uuid-alerte-1',
  produit_id: 'uuid-produit-1',
  produit_nom: 'Samsung Galaxy S21',
  prix_cible: 300000,
};

describe('envoyerAlertePrix', () => {
  test('envoie un email si alerte.email défini', async () => {
    await envoyerAlertePrix({ ...alerteBase, email: 'test@example.com' }, 280000);
    expect(envoyerEmail).toHaveBeenCalledTimes(1);
    const call = envoyerEmail.mock.calls[0][0];
    expect(call.to).toBe('test@example.com');
    expect(call.subject).toContain('Samsung Galaxy S21');
    expect(call.html).toContain('280');
  });

  test("n'envoie pas d'email si alerte.email absent", async () => {
    await envoyerAlertePrix({ ...alerteBase }, 280000);
    expect(envoyerEmail).not.toHaveBeenCalled();
  });

  test('envoie un WhatsApp si alerte.telephone défini', async () => {
    await envoyerAlertePrix({ ...alerteBase, telephone: '+221771234567' }, 280000);
    expect(sendWhatsAppText).toHaveBeenCalledTimes(1);
    const [tel, msg] = sendWhatsAppText.mock.calls[0];
    expect(tel).toBe('+221771234567');
    expect(msg).toContain('Samsung Galaxy S21');
    expect(msg).toContain('280');
  });

  test("n'envoie pas de WhatsApp si alerte.telephone absent", async () => {
    await envoyerAlertePrix({ ...alerteBase, email: 'test@example.com' }, 280000);
    expect(sendWhatsAppText).not.toHaveBeenCalled();
  });

  test('envoie email ET WhatsApp si les deux sont définis', async () => {
    await envoyerAlertePrix(
      { ...alerteBase, email: 'test@example.com', telephone: '+221771234567' },
      280000
    );
    expect(envoyerEmail).toHaveBeenCalledTimes(1);
    expect(sendWhatsAppText).toHaveBeenCalledTimes(1);
  });

  test('désactive toujours l\'alerte après envoi (UPDATE active=false)', async () => {
    await envoyerAlertePrix({ ...alerteBase }, 280000);
    expect(pool.query).toHaveBeenCalledWith(
      'UPDATE alertes SET active=false WHERE id=$1',
      [alerteBase.id]
    );
  });
});
