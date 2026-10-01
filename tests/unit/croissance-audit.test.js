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

describe('AUD-120 : paiements initiés tracés et relancés', () => {
  const { enregistrerInitiation, marquerPaye } = require('../../backend/lib/paiementsInities');

  test('enregistrerInitiation écrit une ligne idempotente (ON CONFLICT DO NOTHING)', async () => {
    const pool = { query: jest.fn(async () => ({ rows: [] })) };
    await enregistrerInitiation(pool, { reference: 'abmt_u1_pro_1_123', utilisateurId: 'u1', plan: 'pro', montant: 5000 });
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO paiements_inities/);
    expect(sql).toMatch(/ON CONFLICT \(reference\) DO NOTHING/);
    expect(params).toEqual(['abmt_u1_pro_1_123', 'u1', 'abonnement', 'pro', 5000, 'wave', 'initie']);
  });

  test('un échec de traçage ne lève jamais d\'exception (un paiement ne doit pas être bloqué)', async () => {
    const pool = { query: jest.fn(async () => { throw new Error('db down'); }) };
    await expect(enregistrerInitiation(pool, { reference: 'r' })).resolves.toBeUndefined();
    await expect(marquerPaye(pool, 'r')).resolves.toBeUndefined();
  });

  test('marquerPaye passe l\'initiation à payé', async () => {
    const pool = { query: jest.fn(async () => ({ rows: [] })) };
    await marquerPaye(pool, 'abmt_u1_pro_1_123');
    expect(pool.query.mock.calls[0][0]).toMatch(/SET statut = 'paye'/);
    expect(pool.query.mock.calls[0][1]).toEqual(['abmt_u1_pro_1_123']);
  });

  test('les routes d\'initiation et de validation sont câblées', () => {
    const fs = require('fs'), path = require('path');
    const lire = (p) => fs.readFileSync(path.join(__dirname, '../..', p), 'utf8');
    expect(lire('backend/routes/abonnements.js')).toMatch(/enregistrerInitiation\(pool, \{ reference: clientRef/);
    expect(lire('backend/routes/paiement.js')).toMatch(/await marquerPaye\(pool, reference\)/);
  });
});

describe('AUD-121 : Orange Money sans simulation en production', () => {
  const chargerOm = (env) => {
    jest.resetModules();
    jest.doMock('../../backend/lib/settingsCache', () => ({ get: jest.fn(async () => null), getNum: jest.fn(), getBool: jest.fn() }));
    const avant = { NODE_ENV: process.env.NODE_ENV, OM_BASE_URL: process.env.OM_BASE_URL, OM_CLIENT_ID: process.env.OM_CLIENT_ID, OM_CLIENT_SECRET: process.env.OM_CLIENT_SECRET };
    Object.assign(process.env, env);
    for (const k of ['OM_CLIENT_ID', 'OM_CLIENT_SECRET', 'OM_BASE_URL']) if (env[k] === undefined) delete process.env[k];
    const om = require('../../backend/services/orange-money');
    return { om, restaurer: () => Object.entries(avant).forEach(([k, v]) => (v === undefined ? delete process.env[k] : (process.env[k] = v))) };
  };

  test('production sans identifiants : refus explicite, aucune URL simulée', async () => {
    const { om, restaurer } = chargerOm({ NODE_ENV: 'production' });
    try {
      await expect(om.createWebPayment({ amount: 100, order_id: 'ann_1', return_url: 'https://x/ok' }))
        .rejects.toThrow(/momentanément indisponible/);
    } finally { restaurer(); }
  });

  test('hors production : la simulation reste disponible (tests, développement)', async () => {
    const { om, restaurer } = chargerOm({ NODE_ENV: 'test' });
    try {
      const r = await om.createWebPayment({ amount: 100, order_id: 'ann_1', return_url: 'https://x/ok' });
      expect(r.mode).toBe('sandbox_simulation');
    } finally { restaurer(); }
  });

  test('le lien de retour pointe la page de succès (et non /retour-paiement sans status)', () => {
    const fs = require('fs'), path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '../../backend/routes/paiement.js'), 'utf8');
    expect(src).toMatch(/return_url: `\$\{process\.env\.FRONTEND_URL \|\| 'https:\/\/nopalou\.com'\}\/paiement\/succes\?ref=\$\{encodeURIComponent\(commande_id\)\}&methode=orange`/);
  });
});

describe('AUD-115 / AUD-124 / AUD-126 : textes sans allégation non prouvée ni prix faux', () => {
  const fs = require('fs'), path = require('path');
  const racine = path.join(__dirname, '../..');
  const parcourir = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['node_modules', '.next', '__tests__'].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) parcourir(p, out);
      else if (/\.(tsx?|js)$/.test(e.name)) out.push(p);
    }
    return out;
  };
  const sources = [...parcourir(path.join(racine, 'frontend-next/src')), path.join(racine, 'backend/services/prospection.js')];
  const contenus = sources.map(f => [path.relative(racine, f), fs.readFileSync(f, 'utf8')]);
  const fautifs = (re) => contenus.filter(([, s]) => re.test(s)).map(([f]) => f);

  test('aucune allégation « N°1 au Sénégal / à Dakar / à Shopify » dans les pages, supports et gabarits', () => {
    expect(fautifs(/N°\s?1[\s ]+(au|à)[\s ]+(Sénégal|Dakar|Shopify)|comparateur N°1|portail auto n°1|logiciel N°1|plateforme e-commerce N°1/i)).toEqual([]);
  });

  test('la méta de /creer-boutique ne annonce plus Taf Taf à 5.000 FCFA', () => {
    const layout = contenus.find(([f]) => f.replace(/\\/g, '/').endsWith('creer-boutique/layout.tsx'))[1];
    expect(layout).not.toMatch(/Taf Taf 5\.000/);
    expect(layout).not.toMatch(/dès 5\.000 FCFA/);
  });

  test('le message de partage de vitrine ne promet plus la livraison et porte un suivi UTM', () => {
    const modal = contenus.find(([f]) => f.replace(/\\/g, '/').endsWith('ModalBoutiqueCreeeSucces.tsx'))[1];
    expect(modal).not.toMatch(/Livraison rapide partout/);
    expect(modal).toMatch(/utm_medium=partage_vitrine/);
  });

  test('les accroches « 100 % hors-ligne » absolues sont retirées des vitrines marchandes principales', () => {
    expect(fautifs(/100% HORS-LIGNE|100% Hors-Ligne|100% hors-ligne sans Internet|FONCTIONNE SANS INTERNET \(100% HORS-LIGNE\)/)).toEqual([]);
  });
});


describe("AUD-111 : plus aucun texte d'essai gratuit écrit en dur dans les pages et composants", () => {
  const fs2 = require('fs'), path2 = require('path');
  const racine2 = path2.join(__dirname, '../..', 'frontend-next/src');
  // Hors périmètre : suppression de compte (30 j de grâce), Sama Xaalis (réglage kalpe_essai_jours), mise en avant payante (30 j),
  // agences immobilières (plans propres), libellés d'administration du réglage lui-même.
  const EXCLUS = /SupprimerCompte|kalpe|Kalpe|sama-xaalis|[\\/]agence[\\/]|SponsoringImmo|paiement[\\/]succes|HeroAgence|MarketingBoutique|GuidePrix|logiciel-gestion-locative|AdminSystemClient|TarifsClient|__tests__|essai-format/;
  const RE = /(?:30|1)\s*(?:jours?|j\b)[^.\n]{0,25}?(?:offerts?|gratuits?|d['’]essai|d&apos;essai)|(?:1er|1|premier)\s*mois\s*(?:100\s?%\s*)?(?:offert|gratuit)|1 MOIS OFFERT|pendant 30\s?j|30j\s*offerts|1ER MOIS 100% OFFERT|1er Mois Offert/gi;
  const lister = (d, out = []) => {
    for (const e of fs2.readdirSync(d, { withFileTypes: true })) {
      if (['node_modules', '.next'].includes(e.name)) continue;
      const p = path2.join(d, e.name);
      if (e.isDirectory()) lister(p, out); else if (/\.(tsx?|mjs)$/.test(e.name)) out.push(p);
    }
    return out;
  };

  test('aucune occurrence littérale (le texte doit utiliser la variable essai du réglage admin)', () => {
    const fautifs = [];
    for (const f of lister(racine2)) {
      if (EXCLUS.test(f)) continue;
      const lignes = fs2.readFileSync(f, 'utf8').split(/\r?\n/);
      lignes.forEach((l, i) => { if (!/^\s*(\/\/|\*|\{\/\*)/.test(l) && RE.test(l)) fautifs.push(path2.relative(racine2, f) + ':' + (i + 1)); RE.lastIndex = 0; });
    }
    expect(fautifs).toEqual([]);
  });

  test("le layout racine fournit la durée d'essai du réglage admin aux composants clients", () => {
    const layout = fs2.readFileSync(path2.join(racine2, 'app/layout.tsx'), 'utf8');
    expect(layout).toMatch(/getEssaiJours\(\)/);
    expect(layout).toMatch(/<EssaiProvider jours=\{essaiJours\}>/);
  });

  test("aucun composant client n'importe le helper serveur (server-only)", () => {
    const fautifs = [];
    for (const f of lister(racine2)) {
      const s2 = fs2.readFileSync(f, 'utf8');
      if (/from '@\/lib\/essai'/.test(s2) && /^[\s\uFEFF]*['"]use client['"]/.test(s2.slice(0, 400))) fautifs.push(path2.relative(racine2, f));
    }
    expect(fautifs).toEqual([]);
  });
});
