import { launch, BASE, login, state, readIDB, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id;
const { browser, ctx, page } = await launch();
await ctx.addInitScript(() => { window.open = () => null; window.print = () => {}; });
await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
await ctx.setOffline(true); await page.waitForTimeout(4500);
await page.getByText('Boubou Off').first().click(); await page.waitForTimeout(250);
await page.getByRole('button', { name: /Encaisser/ }).first().click(); await page.waitForTimeout(2200);
const before = Number(sql(`SELECT count(*) n FROM ventes WHERE boutique_id='${bid}'`)[0].n);
res.file_avant = (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => ({ id: v.id_temporaire, status: v.status }));
// Reconnexion, mais la réponse du serveur n'arrive jamais (réseau qui retombe / application tuée pendant l'envoi)
await page.route('**/api/boutiques/*/pos-vente', () => { /* requête suspendue, jamais traitée */ });
await ctx.setOffline(false); await page.waitForTimeout(3000);
res.pendant_envoi = (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => ({ id: v.id_temporaire, status: v.status }));
const ui1 = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
res.ui_pendant_envoi = ui1.match(/[^.]{0,40}(en attente|hors-ligne|synchron)[^.]{0,40}/gi)?.slice(0, 3);
await page.close();           // application fermée / processus tué en plein envoi
const p2 = await ctx.newPage(); await p2.unroute?.('**/*').catch(() => {});
const posts = []; p2.on('request', r => { if (r.method() === 'POST' && /pos-vente/.test(r.url())) posts.push(r.url()); });
await p2.goto(BASE + '/boutique/caisse', { waitUntil: 'load' }); await p2.waitForTimeout(3500);
if (await p2.locator('button', { hasText: 'Gérant Off M' }).count()) { await p2.locator('button', { hasText: 'Gérant Off M' }).first().click(); await p2.locator('input[type=password]').first().fill('1357'); await p2.keyboard.press('Enter'); }
await p2.waitForTimeout(40000);
res.apres_reouverture_en_ligne_40s = (await readIDB(p2, ['ventes_queue'])).ventes_queue.map(v => ({ id: v.id_temporaire, status: v.status, total: v.total }));
res.posts_envoyes_par_la_nouvelle_page = posts.length;
res.vente_en_base = Number(sql(`SELECT count(*) n FROM ventes WHERE boutique_id='${bid}'`)[0].n) - before;
const ui2 = (await p2.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
res.ui_apres = ui2.match(/[^.]{0,40}(en attente|hors-ligne|synchron)[^.]{0,40}/gi)?.slice(0, 3) || 'aucun indicateur de vente en attente';
out(res); await browser.close();
