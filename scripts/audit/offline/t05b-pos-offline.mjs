import { launch, BASE, login, state, readIDB, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id;
const { browser, ctx, page, logs } = await launch();
await ctx.addInitScript(() => { window.open = () => null; window.print = () => {}; }); // limite de test : l'impression automatique recharge la page hors-ligne (voir H-1)
await login(page, S.M.email, S.pw); await openPos(page, S);
await page.waitForTimeout(3000);
res.A_idb_avant_coupure = await (async () => { const r = await readIDB(page, ['produits', 'caissiers', 'ventes_queue']); return { produits: r.produits.length, caissiers: r.caissiers.length, ventes_queue: r.ventes_queue.length, stores: r.stores }; })();
res.A_localStorage = await page.evaluate(() => ({ user: localStorage.getItem('nopalou_user_id'), keys: Object.keys(localStorage).filter(k => k.startsWith('nopalou')).slice(0, 25), sessionPersistee: Object.keys(localStorage).filter(k => /session/i.test(k)) }));
// B. coupure + rechargement hors-ligne
await ctx.setOffline(true); await page.waitForTimeout(5000);
await page.reload({ waitUntil: 'load' }).catch(e => { res.B_reload_err = String(e.message).split('\n')[0]; }); await page.waitForTimeout(4000);
res.B_apres_reload_offline = { url: page.url(), title: await page.title(), texteSession: (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 260) };
await page.screenshot({ path: T + '/pos-offline-reload.png' });
// PIN + session hors-ligne
if (await page.locator('button', { hasText: 'Gérant Off M' }).count()) { await page.locator('button', { hasText: 'Gérant Off M' }).first().click(); await page.locator('input[type=password]').first().fill('1357'); await page.keyboard.press('Enter'); await page.waitForTimeout(2500); }
res.B_session_apres_pin = (await page.getByText('Session de Caisse Fermée').count()) ? 'FERMEE (la session ouverte avant le rechargement est perdue)' : 'ouverte';
if (await page.getByText('Ouvrir la Session de Caisse').count()) { await page.getByText('Ouvrir la Session de Caisse').first().click(); await page.waitForTimeout(600); await page.getByText('Démarrer la Session').first().click(); await page.waitForTimeout(1500); }
res.B_catalogue_offline = await page.evaluate(() => ({ robe: document.body.innerText.includes('Robe Bazin Off'), dernier: document.body.innerText.includes('Dernier Article Off') }));
// C. ventes hors-ligne
const vente = async (lignes) => {
  for (const [nom, n] of lignes) for (let i = 0; i < n; i++) { await page.getByText(nom).first().click(); await page.waitForTimeout(300); }
  await page.getByRole('button', { name: /Encaisser/ }).first().click(); await page.waitForTimeout(2500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
};
const tSale = new Date();
await vente([['Robe Bazin Off', 2]]); await vente([['Dernier Article Off', 1]]);
const q1 = await readIDB(page, ['ventes_queue']);
res.C_queue_apres_ventes = q1.ventes_queue.map(v => ({ id: v.id_temporaire, total: v.total, items: v.items.map(i => `${i.quantite}x ${i.nom} @${i.prix}`), modePaiement: v.modePaiement, session_id: v.session_id, status: v.status, date: v.date, caissier_id: v.caissier_id }));
res.C_stock_local = await page.evaluate(() => { const r = JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => k.startsWith('nopalou_pos_produits_')) || '[]') || '[]'); return r.filter(p => /Off$/.test(p.nom)).map(p => `${p.nom}: stock ${p.stock}`); });
// D. autre appareil : vente du dernier exemplaire côté serveur pendant la coupure
const r = await fetch('http://127.0.0.1:4100/api/boutiques/' + bid + '/pos-vente', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + S.M.token }, body: JSON.stringify({ idempotency_key: 'AUD-AUTRE-APPAREIL-' + S.sfx, items: [{ id: S.prod.L.id, nom: 'Dernier Article Off', quantite: 1, prix: 4000 }], modePaiement: 'especes' }) });
res.D_vente_autre_appareil = { http: r.status, body: (await r.text()).slice(0, 120) };
res.D_stock_serveur_avant_sync = sql(`SELECT nom, stock_quantite, en_stock FROM boutique_produits WHERE boutique_id='${bid}' AND nom LIKE '%Off' ORDER BY nom`);
// E. fermeture / réouverture de l'application (hors-ligne)
await page.waitForTimeout(20000);
await page.close(); const page2 = await ctx.newPage(); page2.on('console', m => { if (['error'].includes(m.type())) logs.push(m.text().slice(0, 160)); });
await page2.goto(BASE + '/boutique/caisse', { waitUntil: 'load' }).catch(() => {}); await page2.waitForTimeout(4000);
const q2 = await readIDB(page2, ['ventes_queue']);
res.E_queue_apres_reouverture = q2.ventes_queue.map(v => ({ id: v.id_temporaire, status: v.status }));
// F. reconnexion
const tReco = new Date(); await ctx.setOffline(false);
await page2.waitForTimeout(25000);
const q3 = await readIDB(page2, ['ventes_queue']);
res.F_queue_apres_reconnexion = q3.ventes_queue.map(v => ({ id: v.id_temporaire, status: v.status }));
res.G_ventes_en_base = sql(`SELECT reference, nom_produit, quantite, montant_total, methode_paiement, session_id, created_at FROM ventes WHERE boutique_id='${bid}' ORDER BY created_at`);
res.G_stock_final = sql(`SELECT nom, stock_quantite, en_stock FROM boutique_produits WHERE boutique_id='${bid}' AND nom LIKE '%Off' ORDER BY nom`);
res.G_horodatage = { vente_hors_ligne_a: q1.ventes_queue[0] && q1.ventes_queue[0].date, reconnexion_a: tReco.toISOString() };
out(res); console.log('logs:', logs.slice(0, 8)); await browser.close();

