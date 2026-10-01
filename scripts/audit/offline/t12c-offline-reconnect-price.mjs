import { launch, BASE, state, out } from './lib.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id, slug = S.M.boutique.slug;
const api = (m, p, b) => fetch('http://127.0.0.1:4100' + p, { method: m, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + S.M.token }, body: b ? JSON.stringify(b) : undefined });
const setPrix = (p) => api('PUT', `/api/boutiques/${bid}/produits/${S.prod.A.id}`, { nom: 'Robe Bazin Off', prix: p, stock_quantite: 50, en_stock: true });
const debut = () => new Date(Date.now() - 2000).toISOString();
const ouvrirPanier = async (page) => { await page.locator('button[aria-label*="anier" i], a[aria-label*="anier" i]').first().click(); await page.waitForTimeout(1200); };
try {
  await setPrix(15000);
  // S3b : WhatsApp Direct hors-ligne, puis reconnexion
  { const a = debut(); const { browser, ctx, page } = await launch();
    await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
    await page.goto(BASE + `/boutiques/${slug}/produits/${S.prod.A.id}`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /Ajouter au panier/i }).first().click(); await page.waitForTimeout(1200);
    await ctx.setOffline(true); await page.waitForTimeout(800);
    await page.getByRole('button', { name: /Commander via WhatsApp Direct/ }).click(); await page.waitForTimeout(3000);
    const t1 = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
    res.S3b_hors_ligne = { ecran: t1.match(/EN ATTENTE D’ENVOI[^]{0,30}/)?.[0] || 'indicateur absent', commandes_en_base: sql(`SELECT count(*) n FROM commandes_boutique WHERE boutique_id='${bid}' AND created_at > '${a}'`)[0].n };
    await ctx.setOffline(false); await page.waitForTimeout(12000);
    res.S3b_apres_reconnexion = sql(`SELECT reference, statut, methode_paiement, montant_total FROM commandes_boutique WHERE boutique_id='${bid}' AND created_at > '${a}'`);
    await browser.close(); }
  // S4b : prix modifié après l'ajout au panier
  { const a = debut(); const { browser, ctx, page } = await launch();
    await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
    await page.goto(BASE + `/boutiques/${slug}/produits/${S.prod.A.id}`, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    await page.getByRole('button', { name: /Ajouter au panier/i }).first().click(); await page.waitForTimeout(1200);
    await page.goto(BASE + '/', { waitUntil: 'load' }); await setPrix(16000);
    await ouvrirPanier(page);
    await page.locator('button', { hasText: /paiement\s*en ligne/i }).first().click(); await page.waitForTimeout(800);
    await page.locator('input[placeholder="Ex: Babacar Ndiaye"]').fill('Test Prix'); await page.locator('input[placeholder="Ex: 77 123 45 67"]').fill('775550000');
    await page.locator('button', { hasText: 'Espèces' }).first().click();
    await page.locator('button', { hasText: /Valider et Payer/ }).first().click(); await page.waitForTimeout(3500);
    const t2 = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
    res.S4b_1er_clic = { message: t2.match(/Le prix a changé[^]{0,160}/)?.[0] || 'AUCUN message', commandes: sql(`SELECT count(*) n FROM commandes_boutique WHERE boutique_id='${bid}' AND created_at > '${a}'`)[0].n, total_affiche: t2.match(/Total\s+([\d  ]+FCFA)/)?.[1] };
    await page.screenshot({ path: T + '/s4b-apres-1er-clic.png' });
    res.S4b_boutons = await page.$$eval('button', bs => bs.filter(b => b.offsetParent).map(b => b.textContent.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 25));
    await page.locator('button', { hasText: /Valider et Payer/ }).first().click({ timeout: 8000 }).catch(() => { res.S4b_2e_clic_erreur = 'bouton absent'; }); await page.waitForTimeout(4500);
    const t3 = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
    res.S4b_2e_clic = { ecran_confirmation: t3.match(/Total à régler[^]{0,25}/)?.[0], base: sql(`SELECT reference, montant_total FROM commandes_boutique WHERE boutique_id='${bid}' AND created_at > '${a}'`) };
    await browser.close(); }
} finally { await setPrix(15000); }
out(res);
