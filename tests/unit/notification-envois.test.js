// Suivi de la livraison réelle des notifications WhatsApp vendeur + repli e-mail / SMS.
// Contexte : Meta accepte un message (wamid) puis peut le refuser par webhook (facture Meta impayée, numéro hors
// WhatsApp...). Avant : « transmise » dès l'acceptation, échec tardif ignoré, aucun repli -> commande jamais reçue.
const fs = require('fs');
const path = require('path');

process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'https://nopalou.test';

const mockQuery = jest.fn();
jest.mock('../../backend/models/db', () => ({ pool: { query: (...a) => mockQuery(...a) } }));

const mockEmail = jest.fn().mockResolvedValue({ id: 'em_1' });
jest.mock('../../backend/services/email', () => ({
  envoyerEmail: (...a) => mockEmail(...a),
  templateEmail: (o) => `<html>${o.titre}|${o.contenuHtml}|${o.boutonUrl}</html>`,
}));

const mockSms = jest.fn().mockResolvedValue({ success: true, provider: 'orange_sn' });
jest.mock('../../backend/services/sms', () => ({ sendSMS: (...a) => mockSms(...a) }));

const mockAlerteAdmin = jest.fn().mockResolvedValue(undefined);
jest.mock('../../backend/services/admin-alerts', () => ({ alerterAdmin: (...a) => mockAlerteAdmin(...a) }));

const mockWhatsapp = jest.fn();
jest.mock('../../backend/services/whatsapp', () => ({ sendWhatsAppNotification: (...a) => mockWhatsapp(...a) }));

const envois = require('../../backend/services/notification-envois');
const { notifierVendeurCommande } = require('../../backend/services/commande-service');

const ENVOI = {
  id: 7, wamid: 'wamid.ABC', type: 'commande', reference_id: 'C-REF1', destinataire: '221771234567',
  payload: { utilisateur_id: 'u1', boutique_id: 'b1', titre: 'Nouvelle commande', resume: 'Boutique <b>X</b>\nRéf C-REF1', lien: 'https://nopalou.test/boutique', lienChemin: '/boutique?tab=commandes' },
};

function sqlAppels(motif) {
  return mockQuery.mock.calls.filter(([sql]) => String(sql).includes(motif));
}
const flush = async () => { for (let i = 0; i < 10; i++) await new Promise((r) => setImmediate(r)); };

beforeEach(() => {
  mockQuery.mockReset();
  mockEmail.mockClear();
  mockSms.mockClear();
  mockAlerteAdmin.mockClear();
  mockWhatsapp.mockReset();
  mockQuery.mockResolvedValue({ rows: [] });
});

describe('declencherRepli', () => {
  test('envoie un e-mail au propriétaire avec lien magique, texte échappé, et pas de SMS sans échec confirmé', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })                                  // réclamation du repli
      .mockResolvedValueOnce({ rows: [{ email: 'marchand@test.sn', telephone: '771234567' }] }); // propriétaire
    const canaux = await envois.declencherRepli(ENVOI, { motif: 'sans accusé', avecSms: false });
    expect(canaux).toEqual(['email']);
    expect(mockEmail).toHaveBeenCalledTimes(1);
    const mail = mockEmail.mock.calls[0][0];
    expect(mail.to).toBe('marchand@test.sn');
    expect(mail.subject).toContain('C-REF1');
    expect(mail.html).toContain('/api/auth/magic-login?token=');
    expect(mail.html).toContain('&lt;b&gt;X&lt;/b&gt;');   // HTML du client/boutique neutralisé
    expect(mail.html).not.toContain('<b>X</b>');
    expect(mockSms).not.toHaveBeenCalled();
  });

  test('ajoute le SMS sur échec confirmé', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })
      .mockResolvedValueOnce({ rows: [{ email: 'marchand@test.sn', telephone: '771234567' }] });
    const canaux = await envois.declencherRepli(ENVOI, { motif: 'impayé', avecSms: true });
    expect(canaux).toEqual(['email', 'sms']);
    expect(mockSms).toHaveBeenCalledWith('221771234567', expect.stringContaining('C-REF1'));
  });

  test('un SMS simulé n\'est pas compté comme un canal de repli', async () => {
    mockSms.mockResolvedValueOnce({ success: true, simulated: true, provider: 'simulation' });
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })
      .mockResolvedValueOnce({ rows: [{ email: null, telephone: '771234567' }] });
    const canaux = await envois.declencherRepli(ENVOI, { motif: 'impayé', avecSms: true });
    expect(canaux).toEqual([]);
    expect(sqlAppels('UPDATE commandes_boutique').length).toBeGreaterThan(0); // « AUCUN repli » consigné sur la commande
  });

  test('aucun canal ne joint le marchand : l\'admin est alerté en CRITIQUE', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })
      .mockResolvedValueOnce({ rows: [{ email: null, telephone: null }] });
    await envois.declencherRepli({ ...ENVOI, destinataire: null }, { motif: 'impayé', avecSms: true });
    expect(mockAlerteAdmin).toHaveBeenCalledWith(expect.objectContaining({ priorite: 'CRITIQUE', type: 'notif_vendeur_injoignable' }));
  });

  test('pas d\'alerte admin quand l\'e-mail est parti', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })
      .mockResolvedValueOnce({ rows: [{ email: 'marchand@test.sn', telephone: null }] });
    await envois.declencherRepli(ENVOI, { motif: 'impayé', avecSms: false });
    expect(mockAlerteAdmin).not.toHaveBeenCalled();
  });

  test('idempotent : un repli déjà réclamé n\'envoie rien', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // réclamation refusée
    expect(await envois.declencherRepli(ENVOI, { motif: 'x', avecSms: true })).toEqual([]);
    expect(mockEmail).not.toHaveBeenCalled();
    expect(mockSms).not.toHaveBeenCalled();
  });
});

describe('traiterStatut (webhook Meta)', () => {
  test('failed : journalise, note la commande et déclenche le repli e-mail + SMS', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...ENVOI, ancien_statut: 'envoye' }] }) // UPDATE statut
      .mockResolvedValueOnce({ rows: [] })                                       // notification_echecs
      .mockResolvedValueOnce({ rows: [] })                                       // note commande
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })                              // réclamation repli
      .mockResolvedValueOnce({ rows: [{ email: 'marchand@test.sn', telephone: '771234567' }] });
    await envois.traiterStatut({ wamid: 'wamid.ABC', statut: 'echec', erreur: 'Business eligibility payment issue' });
    expect(sqlAppels('INSERT INTO notification_echecs')).toHaveLength(1);
    expect(mockEmail).toHaveBeenCalledTimes(1);
    expect(mockSms).toHaveBeenCalledTimes(1);
  });

  test('delivered : écrit « transmise » une seule fois (pas sur le read qui suit)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...ENVOI, ancien_statut: 'envoye' }] })
      .mockResolvedValueOnce({ rows: [] });
    await envois.traiterStatut({ wamid: 'wamid.ABC', statut: 'delivered' });
    expect(sqlAppels('UPDATE commandes_boutique')).toHaveLength(1);
    expect(mockEmail).not.toHaveBeenCalled();

    mockQuery.mockClear();
    mockQuery.mockResolvedValueOnce({ rows: [{ ...ENVOI, ancien_statut: 'delivered' }] });
    await envois.traiterStatut({ wamid: 'wamid.ABC', statut: 'read' });
    expect(sqlAppels('UPDATE commandes_boutique')).toHaveLength(0);
  });

  test('message non suivi (texte libre, prospection) : aucun effet', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    expect(await envois.traiterStatut({ wamid: 'wamid.INCONNU', statut: 'echec', erreur: '131047' })).toBeNull();
    expect(mockEmail).not.toHaveBeenCalled();
  });
});

describe('traiterEnvoisSansAccuse', () => {
  test('relaie par e-mail sans SMS les envois jamais accusés', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [ENVOI] })                                  // sélection
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })                              // réclamation
      .mockResolvedValueOnce({ rows: [{ email: 'marchand@test.sn', telephone: '771234567' }] });
    const r = await envois.traiterEnvoisSansAccuse({ delaiMinutes: 5 });
    expect(r.traites).toBe(1);
    expect(mockEmail).toHaveBeenCalledTimes(1);
    expect(mockSms).not.toHaveBeenCalled();
    const [sql, params] = mockQuery.mock.calls[0];
    expect(sql).toContain("statut = 'envoye'");
    expect(sql).toContain('repli_at IS NULL');
    expect(params[0]).toBe(5);
  });
});

describe('notifierVendeurCommande', () => {
  const boutique = { id: 'b1', nom: 'Dievo Style', slug: 'dievo-style', whatsapp: '221771234567', utilisateur_id: 'u1' };
  const commande = { reference: 'C-REF1', nomProduit: 'Robe', quantite: 1, montantTotal: 25000, fraisLivraison: 0, methodePaiement: 'wave', clientNom: 'Amadou', clientTelephone: '771112233' };

  test('Meta accepte le message : mémorisé pour suivi, « transmise » PAS écrit avant l\'accusé', async () => {
    mockWhatsapp.mockResolvedValue({ messages: [{ id: 'wamid.OK' }] });
    await notifierVendeurCommande(boutique, commande);
    await flush();
    const insert = sqlAppels('INSERT INTO notification_envois');
    expect(insert).toHaveLength(1);
    expect(insert[0][1][0]).toBe('wamid.OK');
    const notes = mockQuery.mock.calls.filter(([sql]) => String(sql).includes('UPDATE commandes_boutique'));
    expect(notes).toHaveLength(0);
  });

  test('échec immédiat (modèle refusé, SMS impossible) : repli e-mail déclenché', async () => {
    mockWhatsapp.mockResolvedValue(null);
    mockQuery.mockImplementation(async (sql) => {
      const s = String(sql);
      if (s.includes('INSERT INTO notification_envois')) return { rows: [{ ...ENVOI, id: 9, wamid: null }] };
      if (s.includes('SET repli_at')) return { rows: [{ id: 9 }] };
      if (s.includes('FROM utilisateurs')) return { rows: [{ email: 'marchand@test.sn', telephone: '771234567' }] };
      return { rows: [] };
    });
    await notifierVendeurCommande(boutique, commande);
    await flush();
    expect(mockEmail).toHaveBeenCalledTimes(1);
    expect(mockEmail.mock.calls[0][0].to).toBe('marchand@test.sn');
  });
});

describe('câblage', () => {
  const lire = (p) => fs.readFileSync(path.join(__dirname, '..', '..', p), 'utf8');

  test('le webhook Meta transmet les statuts failed / delivered / read au suivi', () => {
    const src = lire('backend/routes/whatsapp.js');
    expect(src).toMatch(/traiterStatut\(\{ wamid: statusObj\.id, statut: 'echec'/);
    expect(src).toMatch(/traiterStatut\(\{ wamid: statusObj\.id, statut: statusObj\.status/);
  });

  test('le cron des envois sans accusé est lancé en modes web et worker', () => {
    const src = lire('backend/app.js');
    expect((src.match(/cron-envois-sans-accuse/g) || []).length).toBe(2);
  });

  test('les INSERT dans notification_echecs n\'utilisent que des colonnes existantes', () => {
    const migration = lire('backend/migrate-inline.js');
    expect(migration).toMatch(/CREATE TABLE IF NOT EXISTS notification_echecs[\s\S]*?type\s+VARCHAR[\s\S]*?reference_id/);
    expect(lire('backend/services/whatsapp-chatbot.js')).not.toMatch(/notification_echecs \(type_notification, destinataire/);
  });

  test('la table notification_envois est créée par la migration', () => {
    expect(lire('backend/migrate-inline.js')).toMatch(/CREATE TABLE IF NOT EXISTS notification_envois/);
  });
});
