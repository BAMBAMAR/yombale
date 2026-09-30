import { launch, BASE, login, state, readIDB, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id;
const { browser, ctx, page } = await launch();
await ctx.addInitScript(() => { window.open = () => null; window.print = () => {}; });
await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
// (a) ticket en cours + micro-coupure réseau
await page.getByText('T-Shirt Coton').first().click(); await page.getByText('Robe Bazin Off').first().click(); await page.waitForTimeout(500);
const ticket = async () => (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').match(/Ticket en cours (\d+)/)?.[1] ?? '(écran verrouillé/sans ticket)';
res.a_ticket_avant = await ticket();
await ctx.setOffline(true); await page.waitForTimeout(2500); await ctx.setOffline(false); await page.waitForTimeout(3500);
res.a_ticket_apres_micro_coupure = await ticket();
res.a_ecran_apres = (await page.evaluate(() => document.body.innerText)).includes('Qui encaisse') ? 'PIN redemandé (caisse verrouillée)' : 'POS déverrouillé';
// (b) vente restée à "syncing" (état écrit par l'application avant l'envoi) : est-elle jamais renvoyée ?
await page.evaluate(() => { window.__m = 1; });
if (await page.locator('button', { hasText: 'Gérant Off M' }).count()) { await page.locator('button', { hasText: 'Gérant Off M' }).first().click(); await page.locator('input[type=password]').first().fill('1357'); await page.keyboard.press('Enter'); await page.waitForTimeout(2000); }
await page.evaluate(async ({ bid, uid }) => {
  const db = await new Promise((r, j) => { const q = indexedDB.open('nopalou_pos_offline'); q.onsuccess = () => r(q.result); q.onerror = j; });
  await new Promise(r => { const tx = db.transaction('ventes_queue', 'readwrite'); tx.objectStore('ventes_queue').put({ id_temporaire: 'POS-INJECTE-SYNCING', boutique_id: bid, user_id: uid, session_id: null, caissier_id: null, items: [{ id: null, nom: 'Article libre injecté', quantite: 1, prix: 7777 }], caissier: 'Test', modePaiement: 'especes', client_id: null, total: 7777, date: new Date().toISOString(), status: 'syncing' }); tx.oncomplete = r; });
}, { bid, uid: S.M.uid });
const posts = []; page.on('request', r => { if (r.method() === 'POST' && /pos-vente/.test(r.url())) posts.push(r.url()); });
await ctx.setOffline(true); await page.waitForTimeout(3000); await ctx.setOffline(false); await page.waitForTimeout(3000);
await page.goto(BASE + '/boutique/caisse', { waitUntil: 'load' }); await page.waitForTimeout(45000);
res.b_file = (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => ({ id: v.id_temporaire, status: v.status, total: v.total }));
res.b_posts_pos_vente_envoyes = posts.length;
res.b_vente_en_base = sql(`SELECT count(*) n FROM ventes WHERE boutique_id='${bid}' AND nom_produit='Article libre injecté'`)[0].n;
const ui = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
res.b_indicateur_ui = /en attente de synchronisation|vente\(s\) hors-ligne|non synchronis/i.test(ui) ? 'oui' : 'AUCUN indicateur de vente non synchronisée';
out(res); await browser.close();

