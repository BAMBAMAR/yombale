import { chromium } from '../../../node_modules/playwright/index.mjs';
import { state, out } from './lib.mjs';
const S = state(); const res = {}; const P = 'http://127.0.0.1:3002'; const bid = S.M.boutique.id, pid = S.prod.A.id, slug = S.M.boutique.slug;
const delay = (ms) => fetch(P + '/__delay?ms=' + ms).then(r => r.text());
const majPrix = async (prix) => { const r = await fetch('http://127.0.0.1:4100/api/boutiques/' + bid + '/produits/' + pid, { method: 'PUT', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + S.M.token }, body: JSON.stringify({ nom: 'Robe Bazin Off', prix, stock_quantite: 10 }) }); return r.status; };
const browser = await chromium.launch(); const ctx = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 1200, height: 800 } }); const page = await ctx.newPage();
const url = `/boutiques/${slug}/produits/${pid}`;
const prix = async () => (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').match(/(\d[\d  ]{2,7})\s*FCFA/)?.[1]?.replace(/\D/g, '') ?? '?';
try {
  await delay(0); res.maj_prix_15000 = await majPrix(15000);
  await page.goto(P + '/', { waitUntil: 'load' }); await page.evaluate(() => navigator.serviceWorker.ready); await page.reload({ waitUntil: 'load' });
  await page.goto(P + url, { waitUntil: 'load' }); await page.waitForTimeout(2500); res.prix_visite_initiale = await prix();
  res.maj_prix_16000 = await majPrix(16000);
  await majPrix(17000);
  for (const ms of [6000, 6000]) {
    await delay(ms); const t0 = Date.now(); await page.goto(P + url, { waitUntil: 'load', timeout: 60000 }).catch(() => {}); const dt = Date.now() - t0; await page.waitForTimeout(1200);
    (res.fiche_produit_reseau_lent ||= []).push({ latence_serveur_ms: ms, chargement_ms: dt, prix_affiche: await prix(), prix_reel: 17000 });
  }
  await delay(0);
} finally { await delay(0); await majPrix(15000); const v = await (await fetch('http://127.0.0.1:4100/api/boutiques/' + bid + '/produits/' + pid)).json().catch(() => ({})); res.prix_restaure = v.produit ? v.produit.prix : JSON.stringify(v).slice(0, 80); }
out(res); await browser.close();

