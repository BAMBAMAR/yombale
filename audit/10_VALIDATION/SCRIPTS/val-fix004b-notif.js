// AGENT 8 — FIX-004 : effet de bord « notification marchand/client » sur le chemin de repli Wave.
// Place 1 commande Wave (repli) et 1 commande espèces (témoin) avec des numéros client identifiables, puis cherche leurs traces dans le journal du backend.
const fs = require('fs');
const { LABEL, RUN, pool, http, inscrire, creerBoutique, Suite } = require('./lib');
(async () => {
  const S = new Suite('FIX-004'); S.suffix = '_notif';
  const logFile = process.env.BACKEND_LOG;
  const M = await inscrire('t004N');
  const bq = await creerBoutique(M.token, `Boutique Notif 004 ${RUN}`);
  const p = (await pool.query(`INSERT INTO boutique_produits (boutique_id, nom, prix, stock_quantite, en_stock) VALUES ($1,'Notif 004',1500,20,true) RETURNING id, nom, prix`, [bq.id])).rows[0];
  const telW = `7799${String(Date.now()).slice(-5)}`.slice(0, 9); const telC = `7798${String(Date.now()).slice(-5)}`.slice(0, 9);
  const mk = (tel, m) => http('POST', `/api/comptabilite/${bq.id}/commandes`, { client_nom: 'Notif Audit8', client_telephone: tel, client_adresse: 'Dakar', methode_paiement: m, items: [{ produit_id: p.id, quantite: 1, nom: p.nom, prix: 1500 }] });
  const w = await mk(telW, 'wave'); const c = await mk(telC, 'cash');
  await new Promise((r) => setTimeout(r, 2500)); // laisse les notifications asynchrones se terminer
  const log = logFile ? fs.readFileSync(logFile, 'latin1') : '';
  const lines = log.split('\n');
  const near = (ref) => lines.filter((l) => l.includes(ref)).map((l) => l.slice(0, 200));
  const refW = w.data && w.data.commande && w.data.commande.reference; const refC = c.data && c.data.commande && c.data.commande.reference;
  const notifW = near(refW).filter((l) => /VENDEUR NOTIF|NOTIF VENDEUR/i.test(l)); const notifC = near(refC).filter((l) => /VENDEUR NOTIF|NOTIF VENDEUR/i.test(l));
  const cliW = near(telW.slice(-9)).filter((l) => /CLIENT NOTIF|SMS FALLBACK/i.test(l)); const cliC = near(telC.slice(-9)).filter((l) => /CLIENT NOTIF|SMS FALLBACK/i.test(l));
  S.rec('V4N-01', 'Témoin : la commande espèces déclenche la notification marchand ET la confirmation client', c.status === 201 && notifC.length >= 1 && cliC.length >= 1, 'notifs présentes', { http: c.status, ref: refC, vendeur: notifC, client: cliC });
  S.rec('V4N-02', 'Commande Wave en repli manuel : le marchand est notifié de la commande en attente de paiement manuel', w.status === 201 && notifW.length >= 1, 'notification marchand présente', { http: w.status, ref: refW, vendeur: notifW, client: cliW },
    'Dans comptabilite.js le repli retourne 201 sans appeler notifierCommande() (la notification est différée à la réussite de la session Wave, AUD-102).');
  S.rec('V4N-03', 'Commande Wave en repli manuel : le client reçoit la confirmation (message de commande enregistrée)', w.status === 201 && cliW.length >= 1, 'confirmation client présente', { client: cliW });
  S.save();
  await pool.end();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
