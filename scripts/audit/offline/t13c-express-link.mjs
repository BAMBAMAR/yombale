import { launch, BASE, state, out } from './lib.mjs';
const S = state(); const { browser, page } = await launch();
const url = `/checkout-express?produit=${S.prod.A.id}&boutique=${S.M.boutique.id}&phone=221770009992`;
await page.goto(BASE + url, { waitUntil: 'load' }); await page.waitForTimeout(4000);
const t = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
out({ url_envoyee_par_le_bot_pour_un_panier_de_3_articles_55000F: url.replace(S.prod.A.id, '<premier produit>'), contient_Robe: t.includes('Robe Bazin'), contient_Boubou: t.includes('Boubou'), montants_affiches: t.match(/\d[\d  ]{2,7}\s*FCFA/g)?.slice(0, 6), extrait: t.slice(0, 420) });
await page.screenshot({ path: process.env.AUDIT_TMP + '/express.png' });
await browser.close();
