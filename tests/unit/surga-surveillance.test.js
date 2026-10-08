// SRG-A5-008 : suivi des erreurs et de l'ordonnanceur de Surga (module pur : horloge, alertes et journal injectés)
const { EventEmitter } = require('events');
const { creerSurveillance, SEUIL_TAUX_5XX, MIN_REQUETES } = require('../../backend/services/surga/surveillance');

function installer(extra = {}) {
  const etat = { t: 1_700_000_000_000, alertes: [], journal: [] };
  const s = creerSurveillance({
    maintenant: () => etat.t,
    alerter: async (opts) => { etat.alertes.push(opts); },
    journaliser: async (nom, statut, stats, erreur) => { etat.journal.push({ nom, statut, stats, erreur }); },
    ...extra,
  });
  return { s, etat, avancer: (ms) => { etat.t += ms; } };
}
const types = (etat) => etat.alertes.map((a) => a.type);

describe('erreurs par famille de routes', () => {
  test('alerte quand le taux de 5xx dépasse le seuil sur la fenêtre', () => {
    const { s, etat } = installer();
    for (let i = 0; i < 15; i++) s.compter('sync', 200);
    for (let i = 0; i < 10; i++) s.compter('sync', 500);
    expect(s.evaluerErreurs()).toEqual(expect.arrayContaining(['sync', 'global']));
    expect(types(etat)).toEqual(expect.arrayContaining(['surga_erreurs_sync', 'surga_erreurs_global']));
    expect(etat.alertes.find((a) => a.type === 'surga_erreurs_global').priorite).toBe('CRITIQUE');
    expect(etat.alertes[0].cooldownMs).toBeGreaterThan(0);
  });

  test('pas d\'alerte sous le nombre minimal de requêtes', () => {
    const { s, etat } = installer();
    for (let i = 0; i < MIN_REQUETES - 1; i++) s.compter('sync', 500);
    expect(s.evaluerErreurs()).toEqual([]);
    expect(etat.alertes).toEqual([]);
  });

  test('pas d\'alerte sous le seuil de taux', () => {
    const { s, etat } = installer();
    for (let i = 0; i < 80; i++) s.compter('presse', 200);
    for (let i = 0; i < 10; i++) s.compter('presse', 503);
    expect(10 / 90).toBeLessThan(SEUIL_TAUX_5XX);
    expect(s.evaluerErreurs()).toEqual([]);
    expect(etat.alertes).toEqual([]);
  });

  test('les réponses 4xx ne comptent pas comme des erreurs du serveur', () => {
    const { s } = installer();
    for (let i = 0; i < 40; i++) s.compter('notes', 401);
    expect(s.evaluerErreurs()).toEqual([]);
  });

  test('les erreurs sorties de la fenêtre de 5 minutes sont oubliées', () => {
    const { s, etat, avancer } = installer();
    for (let i = 0; i < 30; i++) s.compter('sync', 500);
    avancer(6 * 60 * 1000);
    expect(s.evaluerErreurs()).toEqual([]);
    expect(s.etat().routes).toEqual([]);
    expect(etat.alertes).toEqual([]);
  });

  test('l\'intergiciel compte la famille de route et le code, sans rien retenir d\'autre', () => {
    const { s } = installer();
    const res = new EventEmitter(); res.statusCode = 500;
    let suite = false;
    s.intergiciel({ path: '/sync', url: '/sync?token=secret', body: { note: 'privé' } }, res, () => { suite = true; });
    expect(suite).toBe(true);
    res.emit('finish');
    expect(s.etat().routes).toEqual([{ groupe: 'sync', total: 1, erreurs_5xx: 1, taux_5xx: 1 }]);
    expect(JSON.stringify(s.etat())).not.toMatch(/secret|privé/);
  });

  test('une exception dans le comptage ne gêne pas la réponse', () => {
    const { s } = installer();
    const res = new EventEmitter(); res.statusCode = 200;
    s.intergiciel({ path: '/' }, res, () => {});
    expect(() => res.emit('finish')).not.toThrow();
    expect(s.etat().routes[0].groupe).toBe('racine');
  });
});

describe('ordonnanceur de rappels', () => {
  test('rien à signaler tant qu\'il n\'est pas démarré dans ce processus', () => {
    const { s, avancer } = installer();
    avancer(60 * 60 * 1000);
    expect(s.evaluerRappels()).toBe(false);
  });

  test('alerte quand plus aucun passage depuis 5 minutes', async () => {
    const { s, etat, avancer } = installer();
    s.demarrerRappels();
    avancer(4 * 60 * 1000);
    expect(s.evaluerRappels()).toBe(false);
    avancer(2 * 60 * 1000);
    expect(s.evaluerRappels()).toBe(true);
    expect(types(etat)).toEqual(['surga_rappels_arret']);
    await s.passageRappels({ traites: 0, succes: 0, echecs: 0 });
    etat.alertes.length = 0;
    expect(s.evaluerRappels()).toBe(false);
    avancer(6 * 60 * 1000);
    expect(s.evaluerRappels()).toBe(true);
  });

  test('alerte après trois échecs de suite, et le compteur repart à zéro après un succès', async () => {
    const { s, etat } = installer();
    await s.passageRappels(null, new Error('base coupée'));
    await s.passageRappels(null, new Error('base coupée'));
    expect(etat.alertes).toEqual([]);
    await s.passageRappels(null, new Error('base coupée'));
    expect(types(etat)).toEqual(['surga_rappels_echecs']);
    await s.passageRappels({ traites: 0, succes: 0, echecs: 0 });
    expect(s.etat().rappels.echecs_consecutifs).toBe(0);
  });

  test('trace l\'activité et les erreurs, et un seul signe de vie par heure', async () => {
    const { s, etat, avancer } = installer();
    await s.passageRappels({ traites: 0, succes: 0, echecs: 0 }); // premier passage : signe de vie
    await s.passageRappels({ traites: 0, succes: 0, echecs: 0 }); // vide : rien
    avancer(60 * 1000);
    await s.passageRappels({ traites: 3, succes: 2, echecs: 1 }); // activité
    await s.passageRappels(null, new Error('boum')); // erreur
    expect(etat.journal.map((j) => [j.nom, j.statut])).toEqual([
      ['surga_rappels', 'succes'], ['surga_rappels', 'succes'], ['surga_rappels', 'erreur'],
    ]);
    expect(etat.journal[1].stats).toEqual({ traites: 3, succes: 2, echecs: 1 });
    expect(etat.journal[2].erreur).toBe('boum');
    avancer(61 * 60 * 1000);
    await s.passageRappels({ traites: 0, succes: 0, echecs: 0 });
    expect(etat.journal.length).toBe(4);
  });

  test('un journal indisponible ne fait pas échouer le passage', async () => {
    const { s } = installer({ journaliser: async () => { throw new Error('base absente'); } });
    await expect(s.passageRappels({ traites: 1, succes: 1, echecs: 0 })).resolves.toBeUndefined();
  });
});

describe('collecte de presse', () => {
  test('alerte sans nouvel article depuis 6 heures, ou sans article du tout', async () => {
    const vieux = installer({ derniereCollecte: async () => new Date(1_700_000_000_000 - 7 * 3600 * 1000) });
    expect(await vieux.s.evaluerPresse()).toBe(true);
    expect(types(vieux.etat)).toEqual(['surga_presse_arret']);
    const vide = installer({ derniereCollecte: async () => null });
    expect(await vide.s.evaluerPresse()).toBe(true);
  });

  test('rien à signaler quand un article est récent, ou quand la base ne répond pas', async () => {
    const frais = installer({ derniereCollecte: async () => new Date(1_700_000_000_000 - 3600 * 1000) });
    expect(await frais.s.evaluerPresse()).toBe(false);
    const panne = installer({ derniereCollecte: async () => { throw new Error('base absente'); } });
    expect(await panne.s.evaluerPresse()).toBe(false);
    expect(panne.etat.alertes).toEqual([]);
  });
});

describe('alertes', () => {
  test('un envoi d\'alerte qui échoue ne remonte pas', () => {
    const { s } = installer({ alerter: () => { throw new Error('whatsapp coupé'); } });
    for (let i = 0; i < 30; i++) s.compter('sync', 500);
    expect(() => s.evaluerErreurs()).not.toThrow();
  });
});
