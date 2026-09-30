const ROOT = require('path').resolve(__dirname,'../../..').replace(/\\\\/g,'/');
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-jwt-secret';
process.env.WAVE_API_KEY = 'integration-wave-key';
process.env.WAVE_WEBHOOK_SECRET = 'integration-wave-webhook-secret';
const payouts = [];
jest.mock('../../../backend/services/wave', () => {
  const real = jest.requireActual('../../../backend/services/wave');
  return { ...real,
    createCheckoutSession: jest.fn(async () => { throw new Error('Wave indisponible (simulé)'); }),
    sendPayout: jest.fn(async (p) => { global.__payouts.push(p); return { id: 'po_sim_' + global.__payouts.length }; }) };
});
global.__payouts = payouts;
jest.mock('../../../backend/services/whatsapp', () => new Proxy({ estDesinscrit: async () => false }, { get: (t, p) => (p in t ? t[p] : async () => ({ ok: true })) }));
jest.mock('../../../backend/services/admin-alerts', () => new Proxy({}, { get: () => async () => ({ ok: true }) }));

describe('P0 - virement Wave automatique sans paiement recu', () => {
  let request, app, pool, tok, bid, res = {};
  const PW = 'Integration!Pass2026x';
  beforeAll(async () => {
    request = require(ROOT + '/node_modules/supertest'); app = require(ROOT + '/backend/app'); ({ pool } = require(ROOT + '/backend/models/db'));
    const reg = await request(app).post('/api/auth/inscription').send({ nom: 'Marchand Payout', email: `payout.${Date.now()}@audit.test`, mot_de_passe: PW });
    tok = reg.body.token;
    const b = await request(app).post('/api/boutiques').set('Authorization', 'Bearer ' + tok).send({ nom: 'Boutique Payout ' + Date.now(), telephone: '771119955', ville: 'Dakar', categorie: 'mode' });
    bid = (b.body.boutique || b.body).id;
  });
  afterAll(async () => { await pool.query('DELETE FROM commandes_boutique WHERE boutique_id=$1', [bid]).catch(() => {}); await pool.end().catch(() => {}); });

  test('commande Wave jamais payee + article libre a 100 000 F : passage a livree => virement declenche, repetable, invisible de la liste admin', async () => {
    const cmd = await request(app).post(`/api/comptabilite/${bid}/commandes`).send({
      client_nom: 'Complice', client_telephone: '770001111', methode_paiement: 'wave',
      items: [{ nom_produit: 'Article fictif', prix_unitaire: 100000, quantite: 1 }] });
    expect(cmd.status).toBe(201);
    const id = cmd.body.commande.id;
    const row0 = (await pool.query('SELECT paiement_recu, statut, montant_total FROM commandes_boutique WHERE id=$1', [id])).rows[0];
    const patch = (statut) => request(app).patch(`/api/comptabilite/${bid}/commandes/${id}`).set('Authorization', 'Bearer ' + tok).send({ statut });
    const r1 = await patch('livree');
    const r2 = await patch('en_attente'); const r3 = await patch('livree');
    const row1 = (await pool.query('SELECT paiement_recu, statut, payout_ref, payout_date FROM commandes_boutique WHERE id=$1', [id])).rows[0];
    const listeAdmin = (await pool.query(`SELECT c.id FROM commandes_boutique c WHERE (c.paiement_recu = true OR c.statut IN ('payee','livree')) AND c.statut != 'reverse' AND (c.methode_paiement ILIKE '%wave%' OR c.methode_paiement = 'pay_wave') AND c.id=$1`, [id])).rowCount;
    console.log('RESULTAT_PAYOUT ' + JSON.stringify({ avant: row0, http: [r1.status, r2.status, r3.status], apres: row1, payoutsWave: global.__payouts.map(p => ({ amount: p.amount, mobile: p.mobile, ref: p.client_reference })), dansListeReversementsAdmin: listeAdmin }));
    expect(global.__payouts.length).toBeGreaterThan(0);
  });
});
