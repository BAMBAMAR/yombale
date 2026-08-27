const axios = require('axios');
jest.mock('axios');

jest.mock('../../backend/models/db', () => ({
  pool: { query: jest.fn().mockResolvedValue({ rows: [] }) },
}));

// Définir les variables d'environnement nécessaires pour WhatsApp
process.env.WHATSAPP_PHONE_NUMBER_ID = '1234567890';
process.env.WHATSAPP_API_TOKEN = 'test-token-xyz';
process.env.FRONTEND_URL = 'https://nopalou.com';

const { sendWhatsAppNotification } = require('../../backend/services/whatsapp');

describe('sendWhatsAppNotification — Garantie livraison Meta 24H', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('envoie à la fois le texte libre et le template Meta certifié nopalou_fiche_texte', async () => {
    axios.post.mockResolvedValue({ data: { messages: [{ id: 'wamid.123' }] } });

    const res = await sendWhatsAppNotification('771234567', {
      textMessage: '✅ Commande confirmée',
      title: '✅ Commande confirmée — Tech Store',
      detail: 'Réf CMD-123 : Votre colis est en cours de préparation.',
      url: 'https://nopalou.com/boutiques/tech-store',
      buttonParam: 'tech-store',
    });

    expect(res).toBeDefined();
    // Au moins 2 appels POST à l'API Graph (1 textMessage + 1 template nopalou_fiche_texte)
    expect(axios.post).toHaveBeenCalled();
    const calls = axios.post.mock.calls;
    
    // Vérifier l'appel template
    const tplCall = calls.find(c => c[1]?.type === 'template');
    expect(tplCall).toBeDefined();
    expect(tplCall[1].to).toBe('221771234567');
    expect(tplCall[1].template.name).toBe('nopalou_fiche_texte');
    expect(tplCall[1].template.language.code).toBe('fr');
    expect(tplCall[1].template.components[0].parameters[0].text).toContain('Tech Store');
    expect(tplCall[1].template.components[1].parameters[0].text).toBe('tech-store');
  });

  test('gère gracieusement les erreurs sans lever d\'exception non interceptée', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    const res = await sendWhatsAppNotification('771234567', {
      textMessage: 'Test',
      title: 'Alerte',
      detail: 'Détail',
    });

    expect(res).toBeNull();
  });

  test('ne fait rien si aucun numéro de téléphone n\'est fourni', async () => {
    const res = await sendWhatsAppNotification(null, {
      title: 'Titre',
    });
    expect(res).toBeNull();
    expect(axios.post).not.toHaveBeenCalled();
  });
});
