import { launch, BASE, state, out } from './lib.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id, slug = S.M.boutique.slug;
const api = (m, p, b) => fetch('http://127.0.0.1:4100' + p, { method: m, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + S.M.token }, body: b ? JSON.stringify(b) : undefined });
const setPrix = (p) => api('PUT', `/api/boutiques/${bid}/produits/${S.prod.A.id}`, { nom: 'Robe Bazin Off', prix: p, stock_quantite: 10 });
const decoder = (u) => { try { const x = new URL(u); return { numero: x.pathname.slice(1), message: x.searchParams.get('text') }; } catch { return { brut: u }; } };
const t0 = () => new Date(Date.now() - 2000).toISOString();
try {
  await setPrix(15000);
  // S3 : WhatsApp direct, hors-ligne
  { const a = t0(); const { browser, ctx, page } = await launch(); await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
    await page.goto(BASE + `/boutiques/${slug}/produits/${S.prod.A.id}`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /Ajouter au panier/i }).first().click(); await page.waitForTimeout(1200);
    await ctx.setOffline(true); await page.waitForTimeout(800);
    await page.getByRole('button', { name: /Commander via WhatsApp Direct/ }).click(); await page.waitForTimeout(3500);
    res.S3_whatsapp_direct_HORS_LIGNE = { lien_ouvert: (await page.evaluate(() => window.__opened)).map(decoder), ecran: (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').match(/(Commande|commande)[^]{0,120}/)?.[0]?.slice(0, 120), panier_vide_apres: !(await page.evaluate(() => localStorage.getItem('nopalou_carts'))), commandes_en_base: sql(`SELECT reference FROM commandes_boutique WHERE boutique_id='${bid}' AND created_at > '${a}'`).length };
    await browser.close(); }
  // S4 : prix modifié par le marchand après l'ajout au panier
  { const a = t0(); const { browser, ctx, page } = await launch(); await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
    await page.goto(BASE + `/boutiques/${slug}/produits/${S.prod.A.id}`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /Ajouter au panier/i }).first().click(); await page.waitForTimeout(1200);
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await setPrix(16000);
    await page.locator('button[aria-label*="anier" i], a[aria-label*="anier" i]').first().click(); await page.waitForTimeout(1500);
    res.S4_prix_panier_apres_hausse_serveur = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').match(/Robe Bazin Off[^]{0,60}/)?.[0];
    await page.locator('button', { hasText: /paiement\s*en ligne/i }).first().click(); await page.waitForTimeout(800);
    await page.locator('input[placeholder="Ex: Babacar Ndiaye"]').fill('Test Prix'); await page.locator('input[placeholder="Ex: 77 123 45 67"]').fill('775550000');
    await page.locator('button', { hasText: 'Espèces' }).first().click(); await page.locator('button', { hasText: /Valider et Payer/ }).first().click(); await page.waitForTimeout(4500);
    const ui = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
    res.S4_ecran_confirmation = ui.match(/Total à régler[^]{0,25}/)?.[0];
    await page.locator('button', { hasText: /WhatsApp Direct/ }).first().click().catch(() => {}); await page.waitForTimeout(1200);
    res.S4_message_whatsapp_confirmation = (await page.evaluate(() => window.__opened)).map(decoder);
    res.S4_base = sql(`SELECT reference, montant_total, prix_unitaire, quantite, statut FROM commandes_boutique WHERE boutique_id='${bid}' AND created_at > '${a}'`);
    await browser.close(); }
} finally { await setPrix(15000); }
out(res);
