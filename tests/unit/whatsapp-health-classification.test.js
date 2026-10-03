// Classification des erreurs Meta (journaux de production du 03/10/2026) : une facture Meta impayée bloque TOUS les
// templates, donc toute notification hors fenêtre de 24 h ; elle doit alerter l'admin avec le bon motif.
jest.mock('../../backend/services/admin-alerts', () => ({
  alerterWhatsAppPanne: jest.fn().mockResolvedValue(undefined),
  alerterAdmin: jest.fn().mockResolvedValue(undefined),
}));

const { alerterWhatsAppPanne } = require('../../backend/services/admin-alerts');
const health = require('../../backend/services/whatsapp-health');

describe('whatsapp-health : classification des erreurs Meta', () => {
  beforeEach(() => {
    alerterWhatsAppPanne.mockClear();
    health.recordSuccess();
  });

  test('impayé, 1er message de production (unsettled payments) : PAIEMENT_IMPAYE', () => {
    const r = health.estErreurCritique({
      code: 131042,
      message: 'Business eligibility payment issue',
      details: 'Message failed to send because your WhatsApp Business account has unsettled payments. Visit https://business.facebook.com/billing_hub/accounts/details/',
    });
    expect(r).toMatchObject({ critique: true, type: 'PAIEMENT_IMPAYE' });
  });

  test('impayé, 2e message de production (moyen de paiement) : PAIEMENT_IMPAYE, pas « numéro suspendu »', () => {
    const r = health.estErreurCritique({
      code: 131042,
      message: 'Business eligibility payment issue',
      details: 'Message failed to send because there were one or more errors related to your payment method.',
    });
    expect(r).toMatchObject({ critique: true, type: 'PAIEMENT_IMPAYE' });
  });

  test('le seul code 131042, sans texte exploitable, est un impayé', () => {
    expect(health.estErreurCritique({ code: 131042 })).toMatchObject({ critique: true, type: 'PAIEMENT_IMPAYE' });
  });

  test('131056 (limite de débit par destinataire) n\'est PAS un impayé : pas de fausse alerte critique', () => {
    expect(health.estErreurCritique({ code: 131056, message: 'Pair rate limit hit' })).toEqual({ critique: false });
    health.recordFailure({ code: 131056, message: 'Pair rate limit hit', recipient_id: '221770000000' });
    expect(alerterWhatsAppPanne).not.toHaveBeenCalled();
    expect(health.getStatus().healthy).toBe(true);
  });

  test('un impayé déclenche l\'alerte admin avec le lien de facturation', () => {
    health.recordFailure({
      code: 131042,
      message: 'Business eligibility payment issue',
      href: 'https://business.facebook.com/billing_hub',
    });
    expect(alerterWhatsAppPanne).toHaveBeenCalledWith(expect.objectContaining({
      codeErreur: 131042,
      motif: expect.stringContaining('impayée'),
    }));
    expect(health.getStatus().healthy).toBe(false);
  });
});
