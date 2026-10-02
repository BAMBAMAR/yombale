// tests/unit/reversement-marchand.test.js
jest.mock('../../backend/models/db', () => ({
  pool: { query: jest.fn() },
}));
jest.mock('../../backend/lib/settingsCache', () => ({
  get: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../backend/services/wave', () => ({
  sendPayout: jest.fn(),
}));
jest.mock('../../backend/services/admin-alerts', () => ({
  alerterReversementMarchand: jest.fn().mockResolvedValue({}),
}));
jest.mock('../../backend/services/whatsapp', () => ({
  sendWhatsAppNotification: jest.fn().mockResolvedValue({}),
}));

const { pool } = require('../../backend/models/db');
const wave = require('../../backend/services/wave');
const { alerterReversementMarchand } = require('../../backend/services/admin-alerts');
const {
  declencherReversementAuto,
  calculerNetReversement,
  cleIdempotencePayout,
} = require('../../backend/services/reversement-marchand');

const CMD = {
  id: '11111111-1111-4111-8111-111111111111',
  reference: 'CMD-TEST1',
  boutique_id: 'b1',
  montant_total: 10000,
  montant_commission: null,
};
const BOUTIQUE = { nom: 'Boutique Test', commission_rate: 5, mobile: '771234567' };

function sqlCalls() {
  return pool.query.mock.calls.map(([sql, params]) => ({ sql: sql.replace(/\s+/g, ' '), params }));
}

describe('reversement-marchand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WAVE_API_KEY = 'wave_sn_prod_test';
    delete process.env.REVERSEMENT_AUTOMATIQUE_WAVE;
  });

  test('calcul du net : commission + 2 % de frais Wave', () => {
    expect(calculerNetReversement(CMD, 5)).toEqual({ netAmount: 9300, fraisWave: 200 });
    expect(calculerNetReversement({ ...CMD, montant_commission: 1000 }, 5).netAmount).toBe(8800);
  });

  test('clé d’idempotence stable par commande et au format UUID v4', () => {
    const k1 = cleIdempotencePayout(CMD.id);
    expect(k1).toBe(cleIdempotencePayout(CMD.id));
    expect(k1).not.toBe(cleIdempotencePayout('autre'));
    expect(k1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test('succès : payout envoyé, payout_ref remplacé par l’id Wave, statut inchangé', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [CMD] })      // réservation
      .mockResolvedValueOnce({ rows: [BOUTIQUE] }) // boutique
      .mockResolvedValueOnce({ rowCount: 1 });     // finalisation
    wave.sendPayout.mockResolvedValue({ id: 'pt-abc', status: 'succeeded' });

    const res = await declencherReversementAuto(CMD.id, { source: 'test' });

    expect(res).toEqual({ declenche: true, netAmount: 9300, payoutId: 'pt-abc' });
    expect(wave.sendPayout).toHaveBeenCalledWith(expect.objectContaining({
      amount: 9300,
      mobile: '771234567',
      idempotency_key: cleIdempotencePayout(CMD.id),
    }));
    const [reservation, , finalisation] = sqlCalls();
    expect(reservation.sql).toContain("statut = 'livree' AND paiement_recu = true AND payout_ref IS NULL");
    expect(finalisation.params).toEqual([CMD.id, 'pt-abc', 'auto_en_cours']);
    expect(finalisation.sql).not.toContain('statut');
  });

  test('commande non éligible (pas payée, déjà reversée, pas livrée) : aucun payout', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await declencherReversementAuto(CMD.id);
    expect(res).toEqual({ declenche: false, raison: 'non_eligible' });
    expect(wave.sendPayout).not.toHaveBeenCalled();
  });

  test('échec Wave : réservation libérée pour relance et alerte admin', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [CMD] })
      .mockResolvedValueOnce({ rows: [BOUTIQUE] })
      .mockResolvedValueOnce({ rowCount: 1 });
    const err = new Error('no-permission');
    err.response = { data: { message: 'no-permission' } };
    wave.sendPayout.mockRejectedValue(err);

    const res = await declencherReversementAuto(CMD.id);

    expect(res.declenche).toBe(false);
    const liberation = sqlCalls()[2];
    expect(liberation.sql).toContain('SET payout_ref = NULL');
    expect(liberation.params).toEqual([CMD.id, 'auto_en_cours']);
    expect(alerterReversementMarchand).toHaveBeenCalledWith(expect.objectContaining({ statut: 'echec' }));
  });

  test('désactivé par REVERSEMENT_AUTOMATIQUE_WAVE=false', async () => {
    process.env.REVERSEMENT_AUTOMATIQUE_WAVE = 'false';
    const res = await declencherReversementAuto(CMD.id);
    expect(res).toEqual({ declenche: false, raison: 'wave_auto_inactif' });
    expect(pool.query).not.toHaveBeenCalled();
  });
});
