import { launch, BASE, login, state, swReady, out } from './lib.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id, pid = S.prod.A.id, slug = S.M.boutique.slug;
const { browser, ctx, page } = await launch();
const url = `/boutiques/${slug}/produits/${pid}`;
const prixAffiche = async () => (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').match(/(\d[\d  ]{2,7})\s*FCFA/)?.[1]?.replace(/\D/g, '') ?? '?';
try {
  await page.goto(BASE + '/', { waitUntil: 'load' }); await swReady(page); await page.reload({ waitUntil: 'load' });
  await page.goto(BASE + url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
  res.prix_initial_affiche = await prixAffiche();
  res.prix_initial_api = sql(`SELECT prix FROM boutique_produits WHERE id='${pid}'`)[0].prix;
  // Le marchand augmente le prix
  sql(`UPDATE boutique_produits SET prix=16000 WHERE id='${pid}' RETURNING id`);
  // 1) Réseau lent (latence 4 s, connexion OK) : le visiteur recharge la fiche
  const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 4000, downloadThroughput: 50 * 1024, uploadThroughput: 50 * 1024 });
  const t0 = Date.now(); await page.goto(BASE + url, { waitUntil: 'load', timeout: 60000 }).catch(() => {}); const dt = Date.now() - t0; await page.waitForTimeout(1500);
  res.reseau_lent_latence_4s = { duree_chargement_ms: dt, prix_affiche: await prixAffiche(), prix_reel_serveur: 16000 };
  // 2) Réseau normal : prix correct ?
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await page.goto(BASE + url, { waitUntil: 'load' }); await page.waitForTimeout(2000);
  res.reseau_normal_prix_affiche = await prixAffiche();
  // 3) API marchande lecture (NetworkFirst 1 s) : un fetch client lent renvoie-t-il du périmé ?
  await login(page, S.M.email, S.pw);
  const lire = () => page.evaluate(async (b) => { const t = performance.now(); const r = await fetch(`/api/boutiques/${b}/produits`); const d = await r.json(); const p = (d.produits || d).find(x => /Robe Bazin Off/.test(x.nom)); return { ms: Math.round(performance.now() - t), prix: p && p.prix }; }, bid);
  await page.goto(BASE + '/boutique', { waitUntil: 'load' }); await page.waitForTimeout(3000);
  res.api_marchand_normal = await lire();
  sql(`UPDATE boutique_produits SET prix=17000 WHERE id='${pid}' RETURNING id`);
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 2500, downloadThroughput: 100 * 1024, uploadThroughput: 100 * 1024 });
  res.api_marchand_reseau_lent_latence_2_5s = { ...(await lire()), prix_reel_serveur: 17000 };
} finally { sql(`UPDATE boutique_produits SET prix=15000 WHERE id='${pid}' RETURNING id`); res.prix_restaure = sql(`SELECT prix FROM boutique_produits WHERE id='${pid}'`)[0].prix; }
out(res); await browser.close();
