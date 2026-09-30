import { launch, BASE, state, out } from './lib.mjs';
import { execSync } from 'node:child_process';
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id, slug = S.M.boutique.slug;
const api = (m, p, b) => fetch('http://127.0.0.1:4100' + p, { method: m, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + S.M.token }, body: b ? JSON.stringify(b) : undefined });
const reset = async () => { await api('PUT', `/api/boutiques/${bid}/produits/${S.prod.A.id}`, { nom: 'Robe Bazin Off', prix: 15000, stock_quantite: 10 }); await api('PUT', `/api/boutiques/${bid}/produits/${S.prod.B.id}`, { nom: 'Boubou Off', prix: 25000, stock_quantite: 8 }); };
const derniere = (t0) => sql(`SELECT reference, client_nom, client_telephone, client_adresse, statut, nom_produit, quantite, prix_unitaire, montant_total, frais_livraison, methode_paiement, note, source FROM commandes_boutique WHERE boutique_id='${bid}' AND created_at > '${t0}' ORDER BY created_at`);
async function nouveauClient() { const l = await launch(); await l.ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; }); return l; }
async function remplirPanier(page, qteRobe, qteBoubou) {
  const add = async (pid, n) => { await page.goto(BASE + `/boutiques/${slug}/produits/${pid}`, { waitUntil: 'load' }); await page.waitForTimeout(2500); await page.getByRole('button', { name: /Ajouter au panier/i }).first().click(); await page.waitForTimeout(1200); for (let i = 1; i < n; i++) { await page.locator('button[aria-label="Augmenter"]').first().click(); await page.waitForTimeout(400); } };
  await add(S.prod.A.id, qteRobe); if (qteBoubou) await add(S.prod.B.id, qteBoubou);
}
const decoder = (u) => { try { const x = new URL(u); return { numero: x.pathname.slice(1), message: x.searchParams.get('text') }; } catch { return { brut: u }; } };
await reset();
// ── S1 : WhatsApp direct, en ligne
{ const t0 = new Date().toISOString(); const { browser, page } = await nouveauClient(); await remplirPanier(page, 2, 1);
  await page.getByRole('button', { name: /Commander via WhatsApp Direct/ }).click(); await page.waitForTimeout(3500);
  const opened = await page.evaluate(() => window.__opened); const ui = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
  res.S1_whatsapp_direct_en_ligne = { lien_whatsapp: opened.map(decoder), confirmation_ecran: ui.match(/(Commande|commande)[^]{0,260}/)?.[0]?.slice(0, 260), base: derniere(t0) }; await browser.close(); }
// ── S2 : formulaire, espèces, en ligne
try { const t0 = new Date().toISOString(); const { browser, page } = await nouveauClient(); await remplirPanier(page, 2, 1);
  await page.locator('button', { hasText: /paiement\s*en ligne/i }).first().click(); await page.waitForTimeout(900);
  await page.locator('input[placeholder="Ex: Babacar Ndiaye"]').fill('Awa Diop'); await page.locator('input[placeholder="Ex: 77 123 45 67"]').fill('77 555 12 34'); await page.locator('input[placeholder^="Ex: Sacré"]').fill('Médina, rue 11 x 22');
  await page.locator('button', { hasText: 'Espèces' }).first().click(); const reqs = []; page.on('response', async r => { if (/comptabilite\/.*\/commandes/.test(r.url()) && r.request().method() === 'POST') reqs.push({ status: r.status(), corps: (await r.text().catch(() => '')).slice(0, 400), envoye: JSON.parse(r.request().postData() || '{}') }); }); await page.locator('button', { hasText: /Valider et Payer/ }).first().click(); await page.waitForTimeout(4500); res.S2_requete = reqs;
  const ui = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
  res.S2_formulaire_especes = { ecran_confirmation: ui.match(/(Commande (envoyée|confirmée|enregistrée)|Merci)[^]{0,500}/i)?.[0]?.slice(0, 500), liens_whatsapp_ouverts: (await page.evaluate(() => window.__opened)).map(decoder), base: derniere(t0) };
  const waBtn = page.locator('a[href*="wa.me"], button:has-text("WhatsApp")').first(); res.S2_bouton_whatsapp_confirmation = await waBtn.getAttribute('href').catch(() => null); if (res.S2_bouton_whatsapp_confirmation) res.S2_bouton_whatsapp_confirmation = decoder(res.S2_bouton_whatsapp_confirmation);
  await browser.close(); } catch (e) { res.S2_erreur = String(e.message).split('\n')[0]; }
out(res);


