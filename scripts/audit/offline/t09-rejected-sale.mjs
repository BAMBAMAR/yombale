import { launch, BASE, login, state, readIDB, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id, uid = S.M.uid;
const sauvegarde = sql(`SELECT id, statut, fin FROM abonnements WHERE utilisateur_id='${uid}'`);
const { browser, ctx, page } = await launch();
await ctx.addInitScript(() => { window.open = () => null; window.print = () => {}; });
try {
  await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
  // L'abonnement expire côté serveur pendant que la caisse est ouverte (le plan reste en cache côté appareil)
  sql(`UPDATE abonnements SET statut='expire', fin=NOW() - interval '1 day' WHERE utilisateur_id='${uid}' RETURNING id`);
  const avant = Number(sql(`SELECT count(*) n FROM ventes WHERE boutique_id='${bid}'`)[0].n);
  await page.getByText('T-Shirt Coton').first().click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Encaisser/ }).first().click(); await page.waitForTimeout(3500);
  const ui = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
  res.ui_apres_encaissement_refuse = { toast: ui.match(/(Erreur|refus|Abonnement|abonnement|synchronis|hors-ligne)[^✕]{0,90}/gi)?.slice(0, 4) || 'aucun message', ticketVide: /Votre ticket est (vide|en attente)/i.test(ui) || !/T-Shirt/.test(ui) };
  res.file_locale = (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => ({ id: v.id_temporaire, status: v.status, total: v.total }));
  res.vente_en_base = Number(sql(`SELECT count(*) n FROM ventes WHERE boutique_id='${bid}'`)[0].n) - avant;
  res.session_locale_compte_la_vente = await page.evaluate(() => { const k = Object.keys(localStorage).find(k => k.startsWith('nopalou_pos_session_')); return k ? JSON.parse(localStorage.getItem(k)).ventes : null; });
  // Plusieurs tentatives de synchronisation : la vente refusée est-elle jamais traitée / signalée ?
  const posts = []; page.on('response', r => { if (r.request().method() === 'POST' && /pos-vente/.test(r.url())) posts.push(r.status()); });
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(8000);
  res.apres_reload_8s = { reponses_pos_vente: posts, file: (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => v.status) };
} finally {
  for (const a of sauvegarde) sql(`UPDATE abonnements SET statut='${a.statut}', fin='${a.fin}' WHERE id='${a.id}' RETURNING id`);
  res.abonnement_restaure = sql(`SELECT statut, fin FROM abonnements WHERE utilisateur_id='${uid}'`);
}
out(res); await browser.close();
