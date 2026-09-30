// Parcours commercial réel (panier, statuts, virement, suivi, caisse) — AUD-072 à AUD-086
// Exige une base PostgreSQL de TEST (jamais la production) : DATABASE_URL_TEST.
const HAS_DB_TEST = !!process.env.DATABASE_URL_TEST;
const describeIntegration = HAS_DB_TEST ? describe : describe.skip;

process.env.NODE_ENV = 'test';
if (HAS_DB_TEST) process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-jwt-secret';
process.env.WAVE_API_KEY = 'integration-wave-key';
process.env.WAVE_WEBHOOK_SECRET = 'integration-wave-webhook-secret';

const payouts = [];
jest.mock('../../backend/services/wave', () => {
  const real = jest.requireActual('../../backend/services/wave');
  return {
    ...real,
    createCheckoutSession: jest.fn(async () => { throw new Error('Wave indisponible (test)'); }),
    sendPayout: jest.fn(async (p) => { payouts.push(p); return { id: `po_test_${payouts.length}` }; }),
  };
});
jest.mock('../../backend/services/whatsapp', () => new Proxy({ estDesinscrit: async () => false }, {
  get: (t, p) => (p in t ? t[p] : async () => ({ ok: true })),
}));
jest.mock('../../backend/services/admin-alerts', () => new Proxy({}, { get: () => async () => ({ ok: true }) }));

describeIntegration('Panier réel — prix, stock, statuts, virement, suivi, caisse', () => {
  let request, app, pool, M, N, bM, bN, zone;
  const PW = 'Integration!Pass2026x';
  const cli = { client_nom: 'Client Panier', client_telephone: '770001234' };
  let tick = 0;
  const tel = () => `7700${String(10000 + (++tick))}`; // un numéro distinct par commande (anti double soumission)

  const api = (method, url, body, token) => {
    const r = request(app)[method](url);
    if (token) r.set('Authorization', `Bearer ${token}`);
    return body ? r.send(body) : r;
  };
  const panier = (items, extra = {}) => api('post', `/api/comptabilite/${bM}/commandes`, { ...cli, client_telephone: tel(), methode_paiement: 'cash', items, ...extra });
  const produit = async (who, b, body) => (await api('post', `/api/boutiques/${b}/produits`, body, who.token)).body.produit;
  const row = async (table, id, cols) => (await pool.query(`SELECT ${cols} FROM ${table} WHERE id=$1`, [id])).rows[0];
  const stock = async (id) => Number((await row('boutique_produits', id, 'stock_quantite')).stock_quantite);
  const patch = (b, id, body, token) => api('patch', `/api/comptabilite/${b}/commandes/${id}`, body, token);

  beforeAll(async () => {
    request = require('supertest');
    app = require('../../backend/app');
    ({ pool } = require('../../backend/models/db'));
    const sfx = Date.now();
    const mk = async (k) => {
      const reg = await api('post', '/api/auth/inscription', { nom: `Marchand ${k}`, email: `panier.${k}.${sfx}@integration.test`, mot_de_passe: PW });
      const b = await api('post', '/api/boutiques', { nom: `Boutique Panier ${k} ${sfx}`, telephone: `77111${k === 'M' ? '2200' : '3300'}`, ville: 'Dakar', categorie: 'mode' }, reg.body.token);
      return { token: reg.body.token, id: reg.body.user.id, boutique: (b.body.boutique || b.body).id };
    };
    M = await mk('M'); N = await mk('N'); bM = M.boutique; bN = N.boutique;
    zone = (await api('post', `/api/comptabilite/${bM}/zones`, { nom: 'Zone test', prix: 2500 }, M.token)).body;
  });

  afterAll(async () => {
    if (!pool) return;
    for (const b of [bM, bN]) await pool.query('DELETE FROM commandes_boutique WHERE boutique_id=$1', [b]).catch(() => {});
    for (const b of [bM, bN]) await pool.query('DELETE FROM boutiques WHERE id=$1', [b]).catch(() => {});
    for (const u of [M, N]) await pool.query('DELETE FROM utilisateurs WHERE id=$1', [u.id]).catch(() => {});
    await pool.end().catch(() => {});
  });

  test('AUD-073 : article libre ou produit d\'une autre boutique refusés, prix toujours lu en base', async () => {
    const p = await produit(M, bM, { nom: 'Art A', prix: 2000, stock_quantite: 10 });
    const pn = await produit(N, bN, { nom: 'Art N', prix: 3000, stock_quantite: 5 });
    expect((await panier([{ nom_produit: 'Libre', prix_unitaire: 1, quantite: 1 }])).status).toBe(400);
    expect((await panier([{ produit_id: pn.id, prix_unitaire: 1, quantite: 1 }])).status).toBe(400);
    const ok = await panier([{ produit_id: p.id, prix_unitaire: 1, quantite: 1 }]);
    expect(ok.status).toBe(201);
    expect(Number(ok.body.commande.montant_total)).toBe(2000);
    expect(await stock(pn.id)).toBe(5);
  });

  test('AUD-074 : surstock refusé (409), stock inchangé, aucune commande créée', async () => {
    const p = await produit(M, bM, { nom: 'Art stock1', prix: 1000, stock_quantite: 1 });
    const r = await panier([{ produit_id: p.id, quantite: 5 }]);
    expect(r.status).toBe(409);
    expect(await stock(p.id)).toBe(1);
    const n = (await pool.query('SELECT count(*)::int AS n FROM commandes_boutique WHERE produit_id=$1', [p.id])).rows[0].n;
    expect(n).toBe(0);
    // dernière unité demandée deux fois en même temps : une seule commande acceptée
    const [a, b] = await Promise.all([panier([{ produit_id: p.id, quantite: 1 }]), panier([{ produit_id: p.id, quantite: 1 }])]);
    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(await stock(p.id)).toBe(0);
  });

  test('AUD-075 : produit suspendu, hors vente ou sans prix refusé ; suspendu absent du catalogue public', async () => {
    const susp = await produit(M, bM, { nom: 'Art suspendu', prix: 500, stock_quantite: 5 });
    await pool.query("UPDATE boutique_produits SET statut_moderation='suspendu' WHERE id=$1", [susp.id]);
    const horsvente = await produit(M, bM, { nom: 'Art hors vente', prix: 500 });
    await pool.query('UPDATE boutique_produits SET en_stock=false, stock_quantite=NULL WHERE id=$1', [horsvente.id]);
    const sansprix = await produit(M, bM, { nom: 'Art sans prix', stock_quantite: 5 });
    for (const x of [susp, horsvente, sansprix]) {
      expect((await panier([{ produit_id: x.id, quantite: 1 }])).status).toBe(409);
      expect((await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: tel(), methode_paiement: 'cash', articles: [{ produit_id: x.id, quantite: 1 }] })).status).toBe(409);
    }
    await pool.query('DELETE FROM boutique_produits WHERE id=$1', [susp.id]).catch(() => {}); // neutralise le cache de catalogue ci-dessous
    const s2 = await produit(M, bM, { nom: 'Art suspendu 2', prix: 500, stock_quantite: 5 });
    await pool.query("UPDATE boutique_produits SET statut_moderation='suspendu' WHERE id=$1", [s2.id]);
    const pub = await api('get', `/api/boutiques/${bM}/produits`);
    expect(pub.body.produits.find(p => p.id === s2.id)).toBeUndefined();
    const prive = await api('get', `/api/boutiques/${bM}/produits`, null, M.token);
    expect(prive.body.produits.find(p => p.id === s2.id)).toBeDefined();
  });

  test('AUD-076 : prix et stock de la variante appliqués sur le panier et sur l\'express', async () => {
    const p = await produit(M, bM, { nom: 'Art variantes', prix: 1000, stock_quantite: 20, variantes_skus: JSON.stringify([{ sku: 'XL', attributs: { taille: 'XL' }, prix: 5000, stock_quantite: 3 }]) });
    const v = (await pool.query('SELECT id FROM boutique_produit_variantes WHERE produit_id=$1', [p.id])).rows[0];
    const a = await panier([{ produit_id: p.id, variante_id: v.id, quantite: 1 }]);
    expect(Number(a.body.commande.montant_total)).toBe(5000);
    const b = await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: tel(), methode_paiement: 'cash', articles: [{ produit_id: p.id, variante_id: v.id, quantite: 1 }] });
    expect(b.body.montant_total).toBe(5000);
    expect(Number((await row('boutique_produit_variantes', v.id, 'stock_quantite')).stock_quantite)).toBe(1);
    expect((await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: tel(), methode_paiement: 'cash', articles: [{ produit_id: p.id, variante_id: v.id, quantite: 2 }] })).status).toBe(409);
  });

  test('AUD-077 : annulation restitue le stock UNE fois, annulee terminale, pas de retour en arrière', async () => {
    const p = await produit(M, bM, { nom: 'Art cycle', prix: 1000, stock_quantite: 10 });
    const c = await panier([{ produit_id: p.id, quantite: 3 }]);
    const id = c.body.commande.id;
    expect(await stock(p.id)).toBe(7);
    expect((await patch(bM, id, { statut: 'annulee' }, M.token)).status).toBe(200);
    expect(await stock(p.id)).toBe(10);
    expect((await patch(bM, id, { statut: 'confirmee' }, M.token)).status).toBe(409);
    expect((await patch(bM, id, { statut: 'annulee' }, M.token)).status).toBe(200); // même statut : sans effet
    expect(await stock(p.id)).toBe(10);
    const c2 = await panier([{ produit_id: p.id, quantite: 1 }]);
    await patch(bM, c2.body.commande.id, { statut: 'livree' }, M.token);
    expect((await patch(bM, c2.body.commande.id, { statut: 'en_attente' }, M.token)).status).toBe(409);
  });

  test('AUD-077/078 : commande payée annulée laisse une trace ; frais seuls = 200 ; frais refusés si payée', async () => {
    const p = await produit(M, bM, { nom: 'Art frais', prix: 2000, stock_quantite: 10 });
    const c = await panier([{ produit_id: p.id, quantite: 1 }]);
    const id = c.body.commande.id;
    const f = await patch(bM, id, { frais_livraison: 1500 }, M.token);
    expect(f.status).toBe(200);
    expect(Number(f.body.montant_total)).toBe(3500);
    await pool.query("UPDATE commandes_boutique SET paiement_recu=true, statut='payee' WHERE id=$1", [id]);
    expect((await patch(bM, id, { frais_livraison: 9000 }, M.token)).status).toBe(409);
    expect((await patch(bM, id, { statut: 'annulee' }, M.token)).status).toBe(200);
    const after = await row('commandes_boutique', id, 'note');
    expect(after.note).toMatch(/REMBOURSEMENT CLIENT/);
  });

  test('AUD-072 : virement automatique seulement si encaissé, une seule fois', async () => {
    const p = await produit(M, bM, { nom: 'Art wave', prix: 100000, stock_quantite: 10 });
    const avant = payouts.length;
    const c = await panier([{ produit_id: p.id, quantite: 1 }], { methode_paiement: 'wave' });
    // la session Wave échoue (mock) : la commande est annulée et le client averti
    expect(c.status).toBe(502);
    // commande Wave non payée créée directement : passage à livree => aucun virement
    const { rows: [cmd] } = await pool.query(
      `INSERT INTO commandes_boutique (reference, boutique_id, nom_produit, quantite, prix_unitaire, montant_total, client_nom, client_telephone, methode_paiement, statut, paiement_recu)
       VALUES ('C-TESTPAY1', $1, 'x', 1, 100000, 100000, 'c', '770009999', 'wave', 'en_attente', false) RETURNING id`, [bM]);
    expect((await patch(bM, cmd.id, { statut: 'livree' }, M.token)).status).toBe(200);
    expect(payouts.length).toBe(avant);
    // commande payée : un virement, pas deux
    const { rows: [paid] } = await pool.query(
      `INSERT INTO commandes_boutique (reference, boutique_id, nom_produit, quantite, prix_unitaire, montant_total, client_nom, client_telephone, methode_paiement, statut, paiement_recu)
       VALUES ('C-TESTPAY2', $1, 'x', 1, 100000, 100000, 'c', '770009999', 'wave', 'payee', true) RETURNING id`, [bM]);
    await patch(bM, paid.id, { statut: 'livree' }, M.token);
    await patch(bM, paid.id, { statut: 'livree' }, M.token);
    expect((await patch(bM, paid.id, { statut: 'en_attente' }, M.token)).status).toBe(409);
    expect(payouts.length).toBe(avant + 1);
    expect(payouts[payouts.length - 1].amount).toBe(98000);
    const fin = await row('commandes_boutique', paid.id, 'payout_ref');
    expect(fin.payout_ref).toBe(`po_test_${payouts.length}`);
    // la commande déjà virée ne figure plus dans la liste des reversements dus
    const liste = await pool.query(`SELECT c.id FROM commandes_boutique c WHERE (c.paiement_recu = true OR c.statut IN ('payee','livree')) AND c.statut NOT IN ('reverse','annulee') AND c.payout_ref IS NULL AND c.id=$1`, [paid.id]);
    expect(liste.rowCount).toBe(0);
  });

  test('AUD-079/080 : suivi sans joker, avec les références du panier', async () => {
    const p = await produit(M, bM, { nom: 'Art suivi', prix: 1000, stock_quantite: 10 });
    const c = await panier([{ produit_id: p.id, quantite: 1 }]);
    const ref = c.body.commande.reference;
    expect(ref.startsWith('C-')).toBe(true);
    const ok = await api('get', `/api/boutiques/commandes/suivi?ref=${encodeURIComponent(ref)}`);
    expect(ok.status).toBe(200);
    expect(ok.body.commandes[0].reference).toBe(ref);
    for (const q of ['CMD-%', 'C-%', 'CMD-2026%', '%']) {
      const r = await api('get', `/api/boutiques/commandes/suivi?ref=${encodeURIComponent(q)}`);
      expect([400, 404]).toContain(r.status);
    }
  });

  test('AUD-081 : un code PIN seul n\'ouvre ni la vente ni l\'incident de caisse', async () => {
    await pool.query("INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, actif) VALUES ($1,'Caissier','Test','9876',true)", [bM]);
    const p = await produit(M, bM, { nom: 'Art pos', prix: 1000, stock_quantite: 10 });
    const r = await api('post', `/api/boutiques/${bM}/pos-vente`, { items: [{ produit_id: p.id, quantite: 1, prix_unitaire: 1 }], modePaiement: 'especes', superviseur_pin: '9876' });
    expect(r.status).toBe(403);
    expect(await stock(p.id)).toBe(10);
    const i = await api('post', `/api/boutiques/${bM}/pos-incident`, { superviseur_pin: '9876', ticketId: 'x', items: [] });
    expect(i.status).toBe(403);
    // la session marchand reste valide
    const ok = await api('post', `/api/boutiques/${bM}/pos-vente`, { items: [{ produit_id: p.id, quantite: 1, prix_unitaire: 1000 }], modePaiement: 'especes' }, M.token);
    expect(ok.status).toBe(201);
  });

  test('AUD-084 : express — livraison issue de la zone, livraison offerte appliquée à la livraison', async () => {
    const p = await produit(M, bM, { nom: 'Art express', prix: 2000, stock_quantite: 20 });
    const sansZone = await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: tel(), methode_paiement: 'cash', frais_livraison: 99999, articles: [{ produit_id: p.id, quantite: 1 }] });
    expect(sansZone.body.montant_total).toBe(2000);
    const avecZone = await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: tel(), methode_paiement: 'cash', frais_livraison: 0, zone_livraison_id: zone.id, articles: [{ produit_id: p.id, quantite: 1 }] });
    expect(avecZone.body.montant_total).toBe(4500);
    await pool.query("INSERT INTO boutique_promotions (boutique_id, code, type_remise, valeur, actif) VALUES ($1,'LIVROFF','livraison_offerte',2500,true)", [bM]);
    const promo = await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: tel(), methode_paiement: 'cash', zone_livraison_id: zone.id, code_promo: 'LIVROFF', articles: [{ produit_id: p.id, quantite: 1 }] });
    expect(promo.body.montant_total).toBe(2000);
    const pp = await panier([{ produit_id: p.id, quantite: 1 }], { zone_livraison_id: zone.id, code_promo: 'LIVROFF' });
    expect(Number(pp.body.commande.montant_total)).toBe(2000);
  });

  test('AUD-081 (équipe) : un PIN superviseur seul ne permet ni créer ni modifier un caissier', async () => {
    const { rows: [sup] } = await pool.query("INSERT INTO boutique_caissiers (boutique_id, nom, prenom, code_pin, role, actif) VALUES ($1,'Sup','Test','5432','superviseur',true) RETURNING id", [bM]);
    const creer = await api('post', `/api/boutiques/${bM}/caissiers`, { nom: 'Intrus', code_pin: '4821', superviseur_pin: '5432' });
    expect(creer.status).toBe(403);
    const modifier = await api('put', `/api/boutiques/${bM}/caissiers/${sup.id}`, { code_pin: '4822', superviseur_pin: '5432' });
    expect(modifier.status).toBe(403);
    expect((await pool.query("SELECT count(*)::int AS n FROM boutique_caissiers WHERE boutique_id=$1 AND nom='Intrus'", [bM])).rows[0].n).toBe(0);
    // la session marchand continue de fonctionner
    const ok = await api('post', `/api/boutiques/${bM}/caissiers`, { nom: 'Legitime', code_pin: '4821' }, M.token);
    expect(ok.status).toBe(201);
  });

  test('AUD-084 (Club VIP) : palier réel calculé côté serveur, facturé à l\'identique, reversement non pénalisé', async () => {
    const p = await produit(M, bM, { nom: 'Art vip', prix: 2000, stock_quantite: 50 });
    const telVip = '770555123';
    // deux commandes livrées => Silver (500 FCFA sur la livraison)
    for (let i = 0; i < 2; i++) {
      await pool.query(`INSERT INTO commandes_boutique (reference, boutique_id, nom_produit, quantite, prix_unitaire, montant_total, client_nom, client_telephone, statut, methode_paiement)
                        VALUES ($1,$2,'x',1,2000,2000,'v',$3,'livree','cash')`, [`C-VIP${Date.now()}${i}`, bM, telVip]);
    }
    // Désactivé par défaut : ni affichage ni facturation de la remise
    const off = await api('get', `/api/boutiques/club-vip/statut?telephone=${telVip}&boutique=${bM}`);
    expect(off.body.reduction_livraison).toBe(0);
    expect(off.body.club_vip_boutique).toBe(false);
    const cmdOff = await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: telVip, methode_paiement: 'cash', zone_livraison_id: zone.id, articles: [{ produit_id: p.id, quantite: 1 }] });
    expect(cmdOff.body.montant_total).toBe(4500);
    // seul le propriétaire peut activer ; un autre marchand est refusé
    expect((await api('put', `/api/boutiques/${bM}/club-vip`, { actif: true }, N.token)).status).toBe(403);
    expect((await api('put', `/api/boutiques/${bM}/club-vip`, { actif: 'oui' }, M.token)).status).toBe(400);
    expect((await api('put', `/api/boutiques/${bM}/club-vip`, { actif: true }, M.token)).body.actif).toBe(true);
    expect((await api('get', `/api/boutiques/${bM}/club-vip`, null, M.token)).body.actif).toBe(true);

    const st = await api('get', `/api/boutiques/club-vip/statut?telephone=${telVip}&boutique=${bM}`);
    expect(st.body.palier).toBe('Silver');
    expect(st.body.reduction_livraison).toBe(500);
    const inconnu = await api('get', `/api/boutiques/club-vip/statut?telephone=770999888&boutique=${bM}`);
    expect(inconnu.body.palier).toBe('Bronze');

    const cmd =await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: telVip, methode_paiement: 'cash', zone_livraison_id: zone.id, frais_livraison: 0, articles: [{ produit_id: p.id, quantite: 1 }] });
    expect(cmd.body.montant_total).toBe(4000); // 2000 + 2500 - 500
    const row1 = (await pool.query('SELECT remise_club_vip, frais_livraison FROM commandes_boutique WHERE reference=$1', [cmd.body.reference])).rows[0];
    expect(Number(row1.remise_club_vip)).toBe(500);
    // un client Bronze ne reçoit rien, même en envoyant un montant de livraison réduit
    const bronze = await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: '770999888', methode_paiement: 'cash', zone_livraison_id: zone.id, frais_livraison: 0, articles: [{ produit_id: p.id, quantite: 1 }] });
    expect(bronze.body.montant_total).toBe(4500);

    // reversement : la remise est à la charge du marchand (déjà déduite du total payé, rien n'est ajouté par Nopalou)
    const avant = payouts.length;
    const { rows: [paid] } = await pool.query(
      `INSERT INTO commandes_boutique (reference, boutique_id, nom_produit, quantite, prix_unitaire, montant_total, remise_club_vip, client_nom, client_telephone, methode_paiement, statut, paiement_recu)
       VALUES ('C-TESTVIP1', $1, 'x', 1, 99500, 99500, 500, 'c', '770009999', 'wave', 'payee', true) RETURNING id`, [bM]);
    await patch(bM, paid.id, { statut: 'livree' }, M.token);
    expect(payouts.length).toBe(avant + 1);
    expect(payouts[payouts.length - 1].amount).toBe(97510); // 99500 - 1990 (2 %), sans compensation
  });

  test('Club VIP paramétrable : paliers, seuils, montants et portée définis par le marchand, validés côté serveur', async () => {
    const p = await produit(M, bM, { nom: 'Art vip cfg', prix: 2000, stock_quantite: 50 });
    const telA = '770888111'; // 1 commande livrée dans la boutique M
    const telB = '770888222'; // 1 commande livrée dans l'autre boutique N uniquement
    const insert = (b, t, i) => pool.query(`INSERT INTO commandes_boutique (reference, boutique_id, nom_produit, quantite, prix_unitaire, montant_total, client_nom, client_telephone, statut, methode_paiement)
                                            VALUES ($1,$2,'x',1,2000,2000,'v',$3,'livree','cash')`, [`C-CFG${Date.now()}${i}`, b, t]);
    await insert(bM, telA, 1); await insert(bN, telB, 2);
    const put = (config) => api('put', `/api/boutiques/${bM}/club-vip`, { actif: true, config }, M.token);

    // validations : messages clairs, rien n'est enregistré
    expect((await put({ portee: 'monde', paliers: [{ nom: 'A', min_commandes: 1, remise_fcfa: 100 }] })).status).toBe(400);
    expect((await put({ portee: 'boutique', paliers: [] })).status).toBe(400);
    expect((await put({ portee: 'boutique', paliers: [{ nom: 'A', min_commandes: 0, remise_fcfa: 100 }] })).status).toBe(400);
    expect((await put({ portee: 'boutique', paliers: [{ nom: 'A', min_commandes: 1, remise_fcfa: 0, livraison_offerte: false }] })).status).toBe(400);
    expect((await put({ portee: 'boutique', paliers: [{ nom: 'A', min_commandes: 1, remise_fcfa: 100 }, { nom: 'a', min_commandes: 2, remise_fcfa: 200 }] })).status).toBe(400);
    expect((await put({ portee: 'boutique', paliers: [{ nom: 'A', min_commandes: 1, remise_fcfa: -5 }] })).status).toBe(400);

    // configuration du marchand : dès 1 commande dans SA boutique = 300 F ; dès 3 = livraison offerte plafonnée à 1 500 F
    const ok = await put({ portee: 'boutique', paliers: [
      { nom: 'Fidèle', min_commandes: 1, min_depense: null, remise_fcfa: 300, livraison_offerte: false },
      { nom: 'Ambassadeur', min_commandes: 3, min_depense: 500000, remise_fcfa: 1500, livraison_offerte: true },
    ] });
    expect(ok.status).toBe(200);
    expect(ok.body.config.paliers.map(x => x.nom)).toEqual(['Fidèle', 'Ambassadeur']);
    expect((await api('get', `/api/boutiques/${bM}/club-vip`, null, M.token)).body.config.portee).toBe('boutique');

    const sA = await api('get', `/api/boutiques/club-vip/statut?telephone=${telA}&boutique=${bM}`);
    expect(sA.body.palier).toBe('Fidèle');
    expect(sA.body.reduction_livraison).toBe(300);
    expect(sA.body.prochain_palier.nom).toBe('Ambassadeur');
    const sB = await api('get', `/api/boutiques/club-vip/statut?telephone=${telB}&boutique=${bM}`);
    expect(sB.body.palier).toBe('Bronze'); // sa commande est dans une autre boutique : portée « boutique »

    const cmd = await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: telA, methode_paiement: 'cash', zone_livraison_id: zone.id, articles: [{ produit_id: p.id, quantite: 1 }] });
    expect(cmd.body.montant_total).toBe(4200); // 2000 + 2500 - 300
    const nonEligible = await api('post', '/api/boutiques/commandes/express', { boutique_id: bM, ...cli, client_telephone: telB, methode_paiement: 'cash', zone_livraison_id: zone.id, articles: [{ produit_id: p.id, quantite: 1 }] });
    expect(nonEligible.body.montant_total).toBe(4500);

    // portée plateforme : la commande faite chez N compte aussi
    await put({ portee: 'plateforme', paliers: [{ nom: 'Fidèle', min_commandes: 1, remise_fcfa: 300 }] });
    expect((await api('get', `/api/boutiques/club-vip/statut?telephone=${telB}&boutique=${bM}`)).body.palier).toBe('Fidèle');
    // un autre marchand ne peut pas lire ni modifier ce réglage
    expect((await api('put', `/api/boutiques/${bM}/club-vip`, { config: { paliers: [] } }, N.token)).status).toBe(403);
    expect((await api('get', `/api/boutiques/${bM}/club-vip`, null, N.token)).status).toBe(403);
  });

  test('AUD-085 : PUT partiel conserve la description ; stock obsolète refusé', async () => {
    const p = await produit(M, bM, { nom: 'Art put', prix: 2000, stock_quantite: 10, description: 'Description importante' });
    const r = await api('put', `/api/boutiques/${bM}/produits/${p.id}`, { prix: 2100 }, M.token);
    expect(r.status).toBe(200);
    expect((await row('boutique_produits', p.id, 'description')).description).toBe('Description importante');
    await panier([{ produit_id: p.id, quantite: 4 }]);
    const obsolete = await api('put', `/api/boutiques/${bM}/produits/${p.id}`, { stock_quantite: 10, stock_precedent: 10 }, M.token);
    expect(obsolete.status).toBe(409);
    expect(await stock(p.id)).toBe(6);
    const frais = await api('put', `/api/boutiques/${bM}/produits/${p.id}`, { stock_quantite: 20, stock_precedent: 6 }, M.token);
    expect(frais.status).toBe(200);
    expect(await stock(p.id)).toBe(20);
  });

  test('AUD-086 : deux commandes de produits différents au même montant ne sont pas fusionnées', async () => {
    const a = await produit(M, bM, { nom: 'Art dbl A', prix: 1000, stock_quantite: 10 });
    const b = await produit(M, bM, { nom: 'Art dbl B', prix: 1000, stock_quantite: 10 });
    const t = tel();
    const r1 = await api('post', `/api/comptabilite/${bM}/commandes`, { ...cli, client_telephone: t, methode_paiement: 'cash', items: [{ produit_id: a.id, quantite: 1 }] });
    const r2 = await api('post', `/api/comptabilite/${bM}/commandes`, { ...cli, client_telephone: t, methode_paiement: 'cash', items: [{ produit_id: b.id, quantite: 1 }] });
    expect(r1.status).toBe(201);
    expect(r2.status).toBe(201);
    expect(r2.body.commande.reference).not.toBe(r1.body.commande.reference);
    // vrai doublon (même articles) : renvoi de la commande existante, pas de second décrément
    const r3 = await api('post', `/api/comptabilite/${bM}/commandes`, { ...cli, client_telephone: t, methode_paiement: 'cash', items: [{ produit_id: b.id, quantite: 1 }] });
    expect(r3.status).toBe(200);
    expect(r3.body.commande.reference).toBe(r2.body.commande.reference);
    expect(await stock(b.id)).toBe(9);
  });
});
