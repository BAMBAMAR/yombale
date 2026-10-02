// Sonde AUDIT VOIX n°8 : recherche vocale de la barre de navigation (NavbarSearch) et dictee du nom/prix a la creation d'un produit (ProduitForm).
// Usage : . scripts\audit\audit-env.ps1 ; node scripts/audit/voice/07-e2e-navbar-produit.mjs   (amorcer avec 03-seed-boutique.mjs)
import { garde, ouvrirNavigateur, connexionUI, pool, FRONT } from './lib.mjs'
garde()
const db = pool()
const u = (await db.query("SELECT id FROM utilisateurs WHERE email='voiceb@audit.test'")).rows[0]
const bq = (await db.query('SELECT id FROM boutiques WHERE utilisateur_id=$1 LIMIT 1', [u.id])).rows[0]
const { browser, page } = await ouvrirNavigateur({ viewport: { width: 1280, height: 900 }, email: 'voiceb@audit.test' })
page.on('pageerror', e => console.log('  [pageerror]', e.message.slice(0, 160)))
await connexionUI(page, 'voiceb@audit.test')

// --- 1. Barre de recherche ---
await page.goto(FRONT + '/', { waitUntil: 'commit', timeout: 150000 })
await page.waitForTimeout(6000)
await page.click('button[aria-label="Ouvrir la recherche"]', { timeout: 20000 }).catch(() => {}) // la barre est repliee par defaut
await page.waitForSelector('button[aria-label="Recherche vocale"]', { timeout: 40000 })
await page.waitForTimeout(2500)
for (const ph of ['Cherche robe en wax', 'Trouve-moi des chaussures', 'iphone 13 pro', 'recherche']) {
  await page.evaluate(v => { window.__VOICE = { alts: [v], delay: 200 }; window.__voiceLog.length = 0 }, ph)
  await page.click('button[aria-label="Recherche vocale"]')
  await page.waitForTimeout(1500)
  const champ = await page.evaluate(() => [...document.querySelectorAll('input')].filter(i => i.offsetParent && /Rechercher|Parlez/.test(i.placeholder)).map(i => i.value))
  const url = page.url()
  console.log(`### NAVBAR « ${ph} » -> champ=${JSON.stringify(champ)} url=${url}`)
  await page.evaluate(() => { const i = [...document.querySelectorAll('input')].find(x => /Rechercher|Parlez/.test(x.placeholder)); if (i) { const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, ''); i.dispatchEvent(new Event('input', { bubbles: true })) } })
}

// --- 2. Creation de produit : dictee nom + prix ---
await page.goto(FRONT + '/boutique?manage=' + bq.id + '&tab=produits', { waitUntil: 'commit', timeout: 150000 })
await page.waitForTimeout(8000)
const btns = await page.$$eval('button', bs => bs.map(b => b.innerText.replace(/\s+/g, ' ').trim()).filter(t => /Ajouter|Nouveau|produit/i.test(t)).slice(0, 10))
console.log('Boutons produit :', JSON.stringify(btns))
const ouvrir = await page.$('button:has-text("Ajouter un produit"), button:has-text("Nouveau produit"), button:has-text("Ajouter")')
if (ouvrir) await ouvrir.click().catch(() => {})
await page.waitForSelector('button[title^="Dicter le nom"]', { timeout: 60000 }).catch(() => console.log('Bouton Dicter introuvable'))
for (const ph of ['Robe Bazin brodé quinze mille', 'Lait Bonnet Rouge 1L 500', 'ajouter iPhone 12 à 350000', 'Pagne 3 mètres deux mille cinq cents', 'Chaussure de sport Nike']) {
  await page.evaluate(v => { window.__VOICE = { alts: [v], delay: 200 }; window.__voiceLog.length = 0 }, ph)
  const b = await page.$('button[title^="Dicter le nom"]')
  if (!b) { console.log('### PRODUIT bouton absent'); break }
  await b.evaluate(x => x.click())
  await page.waitForTimeout(1500)
  const etat = await page.evaluate(() => ({
    nom: document.querySelector('input[placeholder^="Ex: Robe Bazin"]')?.value ?? null,
    prix: [...document.querySelectorAll('input')].find(i => /prix/i.test(i.name || '') || /prix/i.test(i.getAttribute('aria-label') || ''))?.value ?? null,
    retour: [...document.querySelectorAll('div,span')].map(e => e.innerText).find(t => /^(Dictée réussie|Nom dicté|Micro|Erreur)/.test((t || '').trim()) && t.length < 160) || null,
  }))
  console.log(`### PRODUIT « ${ph} » -> ${JSON.stringify(etat)}`)
}
await browser.close(); await db.end()


