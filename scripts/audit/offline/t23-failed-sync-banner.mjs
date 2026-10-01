import { launch, login, state, readIDB, out } from './lib.mjs';
import { openPos } from './t05a-pos-online.mjs';
import { execSync } from 'node:child_process';
// AUD-089 (côté hors-ligne) : vente saisie hors-ligne, abonnement expiré à la reconnexion → entrée `failed` visible,
// puis « Renvoyer » après régularisation. L'abonnement de test est toujours restauré.
const T = process.env.AUDIT_TMP; const S = state(); const res = {};
const sql = (q) => JSON.parse(execSync(`node "${T}/q.js" "${q.replace(/"/g, '\\"')}"`, { env: process.env }).toString());
const bid = S.M.boutique.id, uid = S.M.uid;
const sauvegarde = sql(`SELECT id, statut, fin FROM abonnements WHERE utilisateur_id='${uid}'`);
const restaurer = () => { for (const a of sauvegarde) sql(`UPDATE abonnements SET statut='${a.statut}', fin='${a.fin}' WHERE id='${a.id}' RETURNING id`); };
const ventesTShirt = () => sql(`SELECT count(*) n FROM ventes WHERE boutique_id='${bid}' AND created_at > now() - interval '3 minutes' AND nom_produit LIKE 'T-Shirt%'`)[0].n;
const { browser, ctx, page } = await launch();
await ctx.addInitScript(() => { window.open = () => null; window.print = () => {}; });
try {
  await login(page, S.M.email, S.pw); await openPos(page, S); await page.waitForTimeout(3000);
  await ctx.setOffline(true); await page.waitForTimeout(4500);
  await page.getByText('T-Shirt Coton').first().click(); await page.waitForTimeout(250);
  await page.getByRole('button', { name: /Encaisser/ }).first().click(); await page.waitForTimeout(2500);
  res.file_hors_ligne = (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => v.status);
  sql(`UPDATE abonnements SET statut='expire', fin=NOW() - interval '1 day' WHERE utilisateur_id='${uid}' RETURNING id`);
  await ctx.setOffline(false); await page.waitForTimeout(12000);
  res.apres_reconnexion = (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => ({ status: v.status, erreur: v.last_error }));
  const bandeau = page.getByText(/opération\(s\) à traiter/);
  res.bandeau_visible = await bandeau.first().isVisible().catch(() => false);
  res.vente_en_base_avant_regularisation = ventesTShirt();
  await page.screenshot({ path: T + '/echecs-banner.png' });
  restaurer();
  if (res.bandeau_visible) {
    await bandeau.first().click(); await page.waitForTimeout(600);
    await page.getByRole('button', { name: /Renvoyer/ }).first().click(); await page.waitForTimeout(6000);
  }
  res.apres_renvoi = {
    file: (await readIDB(page, ['ventes_queue'])).ventes_queue.map(v => v.status),
    bandeau_encore_visible: await bandeau.first().isVisible().catch(() => false),
    vente_en_base: ventesTShirt(),
  };
} finally {
  restaurer();
  res.abonnement = sql(`SELECT statut FROM abonnements WHERE utilisateur_id='${uid}'`);
}
out(res);
await browser.close();
