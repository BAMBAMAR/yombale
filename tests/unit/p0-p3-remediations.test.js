// tests/unit/p0-p3-remediations.test.js
// Tests unitaires pour les remédiations P0-P3 (OTP 2FA, Relance Panier Abandonné, Hash SHA-256)

jest.mock('../../backend/models/db', () => ({
  pool: { query: jest.fn() }
}));

jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppText: jest.fn().mockResolvedValue({ success: true, messageId: 'wa-123' }),
  normalisePhone: jest.fn(p => (p.startsWith('+') ? p.slice(1) : p)),
  estDesinscrit: jest.fn().mockResolvedValue(false)
}));

const { pool } = require('../../backend/models/db');
const { sendWhatsAppText } = require('../../backend/services/whatsapp');
const { genererOtp, verifierOtp, hashOtp } = require('../../backend/services/otp');
const { executerRelancePaniers } = require('../../backend/services/relance-panier');

beforeEach(() => {
  pool.query.mockReset();
  sendWhatsAppText.mockClear();
});

describe('Service OTP 2FA (P1 Security Hardening)', () => {
  test('hashOtp produit une empreinte SHA-256 déterministe avec sel', () => {
    const hash1 = hashOtp('123456', 'salt-abc');
    const hash2 = hashOtp('123456', 'salt-abc');
    const hashDiff = hashOtp('123457', 'salt-abc');

    expect(hash1).toHaveLength(64);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hashDiff);
  });

  test('genererOtp invalide les anciens codes et insère un nouveau code à 6 chiffres', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // assurerTableOtp si pas encore migré ou UPDATE invalidation
      .mockResolvedValueOnce({ rows: [] }) // UPDATE ou INSERT
      .mockResolvedValueOnce({ rows: [] }); // INSERT

    const code = await genererOtp('user-uuid-1', 'cloture_caisse', '+221771234567');

    expect(code).toMatch(/^\d{6}$/);

    const calls = pool.query.mock.calls;
    const insertCall = calls.find(c => typeof c[0] === 'string' && c[0].includes('INSERT INTO auth_otps'));
    expect(insertCall).toBeDefined();
    expect(insertCall[1][0]).toBe('user-uuid-1');
    expect(insertCall[1][1]).toBe('cloture_caisse');
    expect(insertCall[1][2]).toHaveLength(64); // hash SHA-256
  });

  test('verifierOtp valide un code correct et le marque comme utilisé', async () => {
    const sel = 'test-salt-123';
    const codeAttendu = '456789';
    const codeHash = hashOtp(codeAttendu, sel);
    const expireFutur = new Date(Date.now() + 600000);

    pool.query
      .mockImplementation(async (sql, params) => {
        if (sql.includes('SELECT id, code_hash')) {
          return {
            rows: [
              {
                id: 'otp-id-1',
                code_hash: codeHash,
                code_sel: sel,
                essais_restants: 3,
                expire_a: expireFutur,
              },
            ],
          };
        }
        if (sql.includes('UPDATE auth_otps SET utilise = TRUE')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

    const res = await verifierOtp('user-uuid-1', 'cloture_caisse', codeAttendu);
    expect(res.valide).toBe(true);

    const calls = pool.query.mock.calls;
    const updateCall = calls.find(c => typeof c[0] === 'string' && c[0].includes('UPDATE auth_otps SET utilise = TRUE'));
    expect(updateCall).toBeDefined();
  });

  test('verifierOtp refuse un code erroné et décrémente les essais', async () => {
    const sel = 'test-salt-123';
    const codeAttendu = '456789';
    const codeHash = hashOtp(codeAttendu, sel);
    const expireFutur = new Date(Date.now() + 600000);

    pool.query
      .mockImplementation(async (sql, params) => {
        if (sql.includes('SELECT id, code_hash')) {
          return {
            rows: [
              {
                id: 'otp-id-1',
                code_hash: codeHash,
                code_sel: sel,
                essais_restants: 3,
                expire_a: expireFutur,
              },
            ],
          };
        }
        if (sql.includes('essais_restants = essais_restants - 1')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

    const res = await verifierOtp('user-uuid-1', 'cloture_caisse', '000000');
    expect(res.valide).toBe(false);
    expect(res.error).toMatch(/Code incorrect/);

    const calls = pool.query.mock.calls;
    const updateCall = calls.find(c => typeof c[0] === 'string' && c[0].includes('essais_restants = essais_restants - 1'));
    expect(updateCall).toBeDefined();
  });
});

describe('Service Relance Panier Abandonné WhatsApp (P1 Conversion)', () => {
  test('détecte et relance les commandes en attente avec notification WhatsApp et anti-doublon', async () => {
    pool.query
      .mockImplementation(async (sql, params) => {
        if (sql.includes('SELECT c.id, c.reference')) {
          return {
            rows: [
              {
                id: 'cmd-uuid-101',
                reference: 'NOP-CMD-8899',
                client_nom: 'Moussa Ndiaye',
                client_telephone: '+221778889900',
                montant_total: 35000,
                nom_produit: 'Chaussure Cuir Touba',
                quantite: 1,
                boutique_nom: 'Touba Shop',
                boutique_tel: '+221770001122',
              },
            ],
          };
        }
        if (sql.includes('UPDATE commandes_boutique')) {
          return { rows: [] };
        }
        return { rows: [] };
      });

    const res = await executerRelancePaniers();

    expect(res.count).toBe(1);
    expect(sendWhatsAppText).toHaveBeenCalledTimes(1);

    const [phoneAppel, messageEnvoye] = sendWhatsAppText.mock.calls[0];
    expect(phoneAppel).toBe('221778889900');
    expect(messageEnvoye).toContain('Moussa');
    expect(messageEnvoye).toContain('NOP-CMD-8899');
    expect(messageEnvoye).toMatch(/35[\s\u202F]000\s*FCFA/);
    expect(messageEnvoye).toContain('Wave');

    // Vérification de la mise à jour anti-doublon en base
    const calls = pool.query.mock.calls;
    const updateCall = calls.find(c => typeof c[0] === 'string' && c[0].includes('relance_panier_envoyee = TRUE'));
    expect(updateCall).toBeDefined();
  });
});
