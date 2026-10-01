// tests/unit/croissance-audit.test.js — AUD-108, AUD-109, AUD-112 (audit croissance du 2026-10-01)
process.env.JWT_SECRET = 'npl_master_jwt_secret_test_2026';

const jwt = require('jsonwebtoken');
const { creerPreuveTelephone, verifierPreuveTelephone } = require('../../backend/lib/phoneProof');
const { demarrerEssaiSiPremiereFois } = require('../../backend/lib/essaiGratuit');
const { marquerLeadConverti } = require('../../backend/lib/crmConversion');

describe('AUD-108 : preuve de possession du numéro', () => {
  test('une preuve valide est acceptée pour le même numéro, quel que soit le format', () => {
    const preuve = creerPreuveTelephone('221770009911');
    expect(verifierPreuveTelephone(preuve, '+221770009911')).toBe(true);
    expect(verifierPreuveTelephone(preuve, '770009911')).toBe(true);
  });

  test('une preuve émise pour un numéro est refusée pour un autre numéro', () => {
    const preuve = creerPreuveTelephone('221770009911');
    expect(verifierPreuveTelephone(preuve, '+221780000000')).toBe(false);
  });

  test('absence, jeton falsifié ou expiré : refus', () => {
    expect(verifierPreuveTelephone(undefined, '+221770009911')).toBe(false);
    expect(verifierPreuveTelephone('abc.def.ghi', '+221770009911')).toBe(false);
    const expiree = jwt.sign({ tel9: '770009911', objet: 'boutique_creation' }, `${process.env.JWT_SECRET}:phone-proof`, { expiresIn: -10 });
    expect(verifierPreuveTelephone(expiree, '+221770009911')).toBe(false);
  });

  test('un jeton de session ne vaut pas preuve de téléphone, et inversement', () => {
    const session = jwt.sign({ userId: 'u1', tel9: '770009911', objet: 'boutique_creation' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    expect(verifierPreuveTelephone(session, '+221770009911')).toBe(false);
    const preuve = creerPreuveTelephone('770009911');
    expect(() => jwt.verify(preuve, process.env.JWT_SECRET)).toThrow('invalid signature');
  });
});

describe('AUD-109 : un seul essai par utilisateur', () => {
  const poolAvec = (flags) => {
    const calls = [];
    return {
      calls,
      query: jest.fn(async (sql, params) => {
        calls.push({ sql, params });
        if (/SELECT\s+EXISTS/i.test(sql)) return { rows: [flags] };
        return { rows: [] };
      }),
    };
  };

  test('premier essai : inséré, sans aucune annulation', async () => {
    const pool = poolAvec({ a_deja_eu_essai: false, a_abonnement_actif: false });
    const r = await demarrerEssaiSiPremiereFois(pool, { userId: 'u1', plan: 'decouverte', prix: 2500, jours: 30 });
    expect(r.cree).toBe(true);
    expect(pool.calls.some(c => /INSERT INTO abonnements/i.test(c.sql))).toBe(true);
    expect(pool.calls.some(c => /UPDATE abonnements/i.test(c.sql))).toBe(false);
    expect(pool.calls.find(c => /INSERT INTO abonnements/i.test(c.sql)).params).toEqual(['u1', 'decouverte', 2500, 30]);
  });

  test('essai déjà utilisé : aucune insertion', async () => {
    const pool = poolAvec({ a_deja_eu_essai: true, a_abonnement_actif: false });
    const r = await demarrerEssaiSiPremiereFois(pool, { userId: 'u1', plan: 'pro', prix: 5000, jours: 30 });
    expect(r).toEqual({ cree: false, raison: 'essai_deja_utilise' });
    expect(pool.calls.some(c => /INSERT INTO abonnements/i.test(c.sql))).toBe(false);
  });

  test('abonnement payant actif : jamais écrasé par un essai', async () => {
    const pool = poolAvec({ a_deja_eu_essai: false, a_abonnement_actif: true });
    const r = await demarrerEssaiSiPremiereFois(pool, { userId: 'u1', plan: 'decouverte', prix: 2500, jours: 30 });
    expect(r).toEqual({ cree: false, raison: 'abonnement_actif' });
    expect(pool.calls.some(c => /INSERT|UPDATE/i.test(c.sql))).toBe(false);
  });
});

describe('AUD-112 : conversion CRM seulement après un contact réel', () => {
  test('la requête exige un message réel et ne repasse pas un lead déjà converti', async () => {
    const pool = { query: jest.fn(async () => ({ rows: [] })) };
    await marquerLeadConverti(pool, '+221 77 000 99 11');
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/prospection_messages_log/);
    expect(sql).toMatch(/'envoye', 'livre', 'lu'/);
    expect(sql).toMatch(/statut <> 'converti'/);
    expect(params).toEqual(['770009911']);
  });

  test('un événement boutique_creee est tracé pour chaque lead converti', async () => {
    const pool = {
      query: jest.fn(async (sql) => (/UPDATE prospection_leads/.test(sql) ? { rows: [{ id: 'l1' }, { id: 'l2' }] } : { rows: [] })),
    };
    const n = await marquerLeadConverti(pool, '770009911');
    expect(n).toBe(2);
    const events = pool.query.mock.calls.filter(([sql]) => /INSERT INTO prospection_lead_events/.test(sql));
    expect(events).toHaveLength(2);
  });

  test('numéro trop court : aucune requête', async () => {
    const pool = { query: jest.fn() };
    expect(await marquerLeadConverti(pool, '1234')).toBe(0);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe('AUD-111 : la durée d\'essai annoncée vient du réglage admin', () => {
  beforeEach(() => jest.resetModules());

  const chargerAvecReglage = async (valeur) => {
    jest.doMock('../../backend/models/db', () => ({
      pool: { query: jest.fn(async () => ({ rows: valeur === null ? [] : [{ key: 'abonnement_essai_jours', value: valeur }] })) },
    }));
    jest.doMock('../../backend/services/whatsapp', () => ({
      sendWhatsAppText: jest.fn(), sendWhatsAppNotification: jest.fn(), sendWhatsAppProspectionDirecte: jest.fn(),
      normalisePhone: (t) => String(t || '').replace(/\D/g, ''), estDesinscrit: jest.fn(),
    }));
    const cfg = require('../../backend/lib/settingsCache');
    await cfg.get('abonnement_essai_jours'); // charge le cache depuis le (faux) pool
    return cfg;
  };

  test('le défaut du code est 30 jours (plus 14)', () => {
    const cfg = require('../../backend/lib/settingsCache');
    expect(cfg.DEFAULTS.abonnement_essai_jours).toBe('30');
  });

  test('gabarits de prospection : aucun « 30 jours » écrit en dur, valeur du réglage appliquée', async () => {
    await chargerAvecReglage('45');
    const { TEMPLATES_PAR_DEFAUT, interpolerMessage } = require('../../backend/services/prospection');
    const brut = TEMPLATES_PAR_DEFAUT.map(t => t.texte).join('\n');
    expect(brut).not.toMatch(/30 jours|30j |1er mois/i);
    expect(brut).toMatch(/\{essai_jours\}/);
    const message = interpolerMessage(TEMPLATES_PAR_DEFAUT[0].texte, { nom_boutique: 'Test', contact_nom: '' });
    expect(message).toMatch(/45 jours/);
    expect(message).not.toMatch(/\{essai_jours\}/);
  });

  test('FAQ WhatsApp : durée issue du réglage', async () => {
    await chargerAvecReglage('21');
    const { getFAQWhatsApp } = require('../../backend/lib/faq');
    const textes = getFAQWhatsApp('https://nopalou.com').map(e => e.reponse).join('\n');
    expect(textes).toMatch(/21 jours/);
    expect(textes).not.toMatch(/1er mois/);
  });
});

describe('AUD-110 / AUD-117 : indicateurs fiables', () => {
  const fs = require('fs');
  const lire = (p) => fs.readFileSync(require('path').join(__dirname, '../..', p), 'utf8');

  test('PAYANT exige une référence d\'encaissement abmt_ ; les attributions admin sont isolées', () => {
    const { PAYANT, ATTRIBUE_ADMIN } = require('../../backend/lib/abonnementsSql');
    expect(PAYANT).toMatch(/commande_ref LIKE 'abmt\\_%'/);
    expect(PAYANT).toMatch(/is_trial = FALSE/);
    expect(ATTRIBUE_ADMIN).toMatch(/commande_ref LIKE 'admin\\_%'/);
  });

  test.each([
    'backend/routes/abonnements.js',
    'backend/routes/admin-dashboard.js',
    'backend/routes/admin-paiements.js',
  ])('%s ne compte plus tout is_trial = FALSE comme revenu', (p) => {
    const src = lire(p);
    expect(src).not.toMatch(/AND is_trial = FALSE\)/);
    expect(src).toMatch(/\$\{PAYANT\}/);
  });

  test('le tableau de bord marchand compte les commandes web écrites par le serveur', () => {
    const src = lire('backend/routes/analytics.js');
    expect(src).toMatch(/FILTER \(WHERE type='commande_web'\)\s+AS commandes_web_total/);
  });
});
