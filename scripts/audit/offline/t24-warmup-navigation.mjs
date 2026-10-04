// t24 : après connexion, toutes les pages principales doivent s'ouvrir hors-ligne, même jamais visitées.
// Témoin (A) : coupure avant la fin du préchauffage -> l'écran de secours apparaît (c'est le défaut signalé).
// Essai (B) : préchauffage terminé puis coupure -> pages réelles, aussi pour des URLs jamais visitées telles quelles
// (`?manage=&tab=`, `?b=`) et pour la navigation interne (router.push).
import { launch, BASE, login, swReady, cacheReport, state, out } from './lib.mjs';
const S = state(); const res = {};
const FALLBACK = /Hors-Ligne/i;
const bid = S.M.boutique.id;

async function visite(page, url) {
  let status = null;
  try {
    const r = await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    status = r && r.status();
  } catch (e) { return { url, erreur: String(e.message).slice(0, 80) }; }
  await page.waitForTimeout(1500);
  const titre = await page.title();
  const h1 = await page.locator('h1').first().textContent({ timeout: 1500 }).catch(() => null);
  return { url, status, secours: FALLBACK.test(titre), titre: titre.slice(0, 50), h1: (h1 || '').trim().slice(0, 50), urlFinale: page.url().replace(BASE, '') };
}

// ── A. Témoin : coupure immédiate, avant préchauffage ─────────────────────────
{
  const { browser, ctx, page } = await launch();
  await login(page, S.M.email, S.pw); await swReady(page);
  await page.waitForTimeout(1200);
  await ctx.setOffline(true);
  res.A_temoin_sans_prechauffage = [await visite(page, '/favoris'), await visite(page, '/mes-alertes'), await visite(page, '/boutiques')];
  await browser.close();
}

// ── B. Essai : préchauffage terminé ───────────────────────────────────────────
{
  const { browser, ctx, page, logs } = await launch();
  await login(page, S.M.email, S.pw); await swReady(page);
  const t0 = Date.now();
  let cle = null;
  for (let i = 0; i < 60 && !cle; i++) { await page.waitForTimeout(1000); cle = await page.evaluate(() => localStorage.getItem('nopalou_offline_pages_warm')).catch(() => null); }
  res.B_prechauffage = { termine: !!cle, secondes: Math.round((Date.now() - t0) / 1000), cle: cle && cle.split('|')[0].slice(0, 8) + '|…' };
  const cr = await cacheReport(page);
  const htmlCache = Object.entries(cr).find(([n]) => n.includes('html-cache'));
  res.B_pages_en_cache = htmlCache ? htmlCache[1].map(u => u.split('?')[0]) : [];

  await ctx.setOffline(true); await page.waitForTimeout(1500);
  const urls = [
    '/favoris', '/mes-alertes', '/mes-annonces', '/deposer-annonce', '/compte/apporteur',
    '/boutique/abonnement', `/boutique?manage=${bid}&tab=carnet`, `/boutique/caisse?b=${bid}`, `/compte?tab=kalpe`,
    '/boutiques', '/immo', '/annonces', '/',
  ];
  res.B_navigation_complete_hors_ligne = [];
  for (const u of urls) res.B_navigation_complete_hors_ligne.push(await visite(page, u));

  // Navigation interne (Link / router.push) : le chargement RSC échoue -> navigation complète depuis le cache
  await visite(page, '/compte');
  const interne = [];
  for (const cible of ['/favoris', '/boutique', '/boutiques']) {
    await page.evaluate((c) => { try { window.next.router.push(c); } catch (e) { location.href = c; } }, cible).catch(() => {});
    await page.waitForTimeout(3500);
    const titre = await page.title();
    interne.push({ cible, urlFinale: page.url().replace(BASE, ''), secours: FALLBACK.test(titre), titre: titre.slice(0, 50) });
    await visite(page, '/compte');
  }
  res.B_navigation_interne_hors_ligne = interne;
  res.B_erreurs_console = logs.filter(l => !/Failed to load resource|net::ERR|offline|Hors-ligne|Failed to fetch/i.test(l)).slice(0, 8);

  const tous = [...res.B_navigation_complete_hors_ligne, ...interne];
  res.VERDICT = {
    temoin_affiche_ecran_secours: res.A_temoin_sans_prechauffage.some(x => x.secours),
    essai_aucune_page_en_secours: tous.every(x => !x.secours && !x.erreur),
    essai_pages_en_secours: tous.filter(x => x.secours || x.erreur).map(x => x.url || x.cible),
  };
  await browser.close();
}
out(res);
