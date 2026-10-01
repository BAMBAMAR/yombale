// tests/unit/prospection-echecs-croissance.test.js — AUD-113 (échecs d'envoi WhatsApp de la prospection)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'npl_master_jwt_secret_test_2026';

const { extraireCodeMeta, classerEchec } = require('../../backend/lib/prospectionEchecs');

describe('AUD-113 : lecture des codes d\'erreur Meta', () => {
  test('extrait le code d\'un code brut ou d\'un message', () => {
    expect(extraireCodeMeta(null, 131049)).toBe(131049);
    expect(extraireCodeMeta('Rejet Meta 131049 : Plafond marketing Meta')).toBe(131049);
    expect(extraireCodeMeta('Numéro invalide ou non-WhatsApp (Code 131026)')).toBe(131026);
    expect(extraireCodeMeta('Erreur réseau')).toBeNull();
  });

  test('classe les échecs', () => {
    expect(classerEchec(131026)).toBe('numero_invalide');
    expect(classerEchec(131051)).toBe('numero_invalide');
    expect(classerEchec(131049)).toBe('plafond_marketing');
    expect(classerEchec(131056)).toBe('autre');
    expect(classerEchec(null)).toBeNull();
  });
});

describe('AUD-113 : lancerCampagne face aux échecs', () => {
  let timeoutSpy;
  beforeEach(() => {
    jest.resetModules();
    // supprime les pauses anti-ban (10-40 s) : le test vérifie la logique, pas la cadence
    timeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((fn) => { fn(); return 0; });
  });
  afterEach(() => timeoutSpy.mockRestore());

  const charger = ({ leads, reponseMeta, plafonne = false }) => {
    const requetes = [];
    jest.doMock('../../backend/models/db', () => ({
      pool: {
        query: jest.fn(async (sql, params) => {
          requetes.push({ sql, params });
          if (/SELECT \* FROM prospection_leads/.test(sql)) return { rows: leads };
          if (/erreur LIKE/.test(sql)) return { rows: plafonne ? [{ '?column?': 1 }] : [] };
          return { rows: [] };
        }),
      },
    }));
    const envoyer = jest.fn(async () => reponseMeta);
    jest.doMock('../../backend/services/whatsapp', () => ({
      sendWhatsAppText: jest.fn(),
      sendWhatsAppNotification: jest.fn(async () => reponseMeta),
      sendWhatsAppProspectionDirecte: envoyer,
      normalisePhone: (t) => String(t || '').replace(/\D/g, ''),
      estDesinscrit: jest.fn(async () => false),
    }));
    const { lancerCampagne } = require('../../backend/services/prospection');
    return { lancerCampagne, envoyer, requetes };
  };

  const faireLeads = (n) => Array.from({ length: n }, (_, i) => ({
    id: `lead-${i}`, telephone: `77123450${i}`, statut: 'nouveau', nom_boutique: `Boutique ${i}`, categorie: 'mode', nb_contacts: 0,
  }));

  test('plafond marketing Meta : la campagne s\'arrête après 5 refus consécutifs', async () => {
    const { lancerCampagne, envoyer } = charger({
      leads: faireLeads(8),
      reponseMeta: { success: false, reason: 'Rejet Meta 131049 : Plafond marketing Meta (Ecosystem Engagement)' },
    });
    await lancerCampagne({ campagneId: null, leadIds: faireLeads(8).map(l => l.id), canal: 'whatsapp', templateMessage: '{salutation} test' });
    expect(envoyer).toHaveBeenCalledTimes(5);
  });

  test('numéro non WhatsApp (131026) : le lead est classé invalide et ne sera plus rejoué', async () => {
    const { lancerCampagne, requetes } = charger({
      leads: faireLeads(1),
      reponseMeta: { success: false, reason: 'Numéro invalide ou non-WhatsApp (Code 131026)' },
    });
    await lancerCampagne({ campagneId: null, leadIds: ['lead-0'], canal: 'whatsapp', templateMessage: '{salutation} test' });
    const maj = requetes.find(r => /SET statut = 'invalide'.*Numéro non WhatsApp/.test(r.sql));
    expect(maj).toBeTruthy();
    expect(maj.params).toEqual(['lead-0', '131026']);
  });

  test('un lead au plafond marketing depuis moins de 7 jours n\'est pas renvoyé', async () => {
    const { lancerCampagne, envoyer } = charger({
      leads: faireLeads(2),
      reponseMeta: { messages: [{ id: 'wamid.1' }] },
      plafonne: true,
    });
    await lancerCampagne({ campagneId: null, leadIds: ['lead-0', 'lead-1'], canal: 'whatsapp', templateMessage: '{salutation} test' });
    expect(envoyer).not.toHaveBeenCalled();
  });

  test('envoi réussi : comportement inchangé (un envoi par lead)', async () => {
    const { lancerCampagne, envoyer } = charger({
      leads: faireLeads(3),
      reponseMeta: { success: true, messages: [{ id: 'wamid.ok' }] },
    });
    await lancerCampagne({ campagneId: null, leadIds: ['lead-0', 'lead-1', 'lead-2'], canal: 'whatsapp', templateMessage: '{salutation} test' });
    expect(envoyer).toHaveBeenCalledTimes(3);
  });
});
