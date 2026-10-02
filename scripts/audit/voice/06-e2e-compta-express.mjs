// Sonde AUDIT VOIX n°7 : Saisie Express comptable de la boutique (useComptaSaisieVoice -> formulaire depense -> POST depenses -> PostgreSQL).
// Usage : . scripts\audit\audit-env.ps1 ; node scripts/audit/voice/06-e2e-compta-express.mjs   (amorcer avec 03-seed-boutique.mjs)
import { garde, ouvrirNavigateur, connexionUI, pool, FRONT } from './lib.mjs'
garde()
const db = pool()
const u = (await db.query("SELECT id FROM utilisateurs WHERE email='voiceb@audit.test'")).rows[0]
const bq = (await db.query('SELECT id FROM boutiques WHERE utilisateur_id=$1 LIMIT 1', [u.id])).rows[0]
const { browser, page } = await ouvrirNavigateur({ viewport: { width: 1280, height: 900 }, email: 'voiceb@audit.test' })
page.on('pageerror', e => console.log('  [pageerror]', e.message.slice(0, 160)))
await connexionUI(page, 'voiceb@audit.test')
const nb = async () => Number((await db.query('SELECT count(*) FROM depenses WHERE boutique_id=$1', [bq.id])).rows[0].count)
const derniere = async () => (await db.query('SELECT montant::int AS montant, categorie, description, date_depense::text FROM depenses WHERE boutique_id=$1 ORDER BY created_at DESC LIMIT 1', [bq.id])).rows[0]

const LIRE = () => {
  const forms = [...document.querySelectorAll('form')]
  const f = forms.find(x => /Valider la Dépense/.test(x.innerText))
  if (!f) return { mode: /Encaisser|Valider la vente|Panier/i.test(document.body.innerText) ? 'vente' : 'inconnu', formDepense: false }
  const montant = f.querySelector('input[type=number]')?.value ?? null
  const desc = [...f.querySelectorAll('input[type=text]')].find(i => /Facture, sacs/.test(i.placeholder))?.value ?? null
  return { mode: 'depense', formDepense: true, montant, description: desc, bouton: [...f.querySelectorAll('button[type=submit]')].map(b => b.innerText.trim())[0] }
}
const S = ['Dépense 5000 transport', "j'ai payé la scolarité 25000", 'pressing 3000', "j'ai dépensé 5000 francs", 'salaire gardien 40000', "j'ai payé 5000 de transport et 2000 de déjeuner"]
await page.goto(FRONT + '/boutique?manage=' + bq.id + '&tab=express', { waitUntil: 'commit', timeout: 150000 })
await page.waitForSelector('button[aria-label*="assistant vocal"]', { timeout: 150000 })
await page.waitForTimeout(2000)
for (const ph of S) {
  await page.evaluate(v => { window.__VOICE = { alts: [v], delay: 200 }; window.__voiceLog.length = 0 }, ph)
  await page.click('button[aria-label*="assistant vocal"]')
  await page.waitForTimeout(1500)
  const ui = await page.evaluate(LIRE)
  const bandeau = await page.evaluate(() => (document.querySelector('[role=dialog]')?.innerText || '').replace(/\s+/g, ' ').slice(0, 200))
  console.log(`### « ${ph} »\n   UI: ${JSON.stringify(ui)}\n   Bandeau vocal: ${bandeau}`)
  await page.mouse.click(5, 5) // ferme la modale d'aide vocale
  await page.waitForTimeout(500)
  if (ui.formDepense && ui.montant) {
    const avant = await nb()
    await page.click('button[type=submit]:has-text("Valider la Dépense")').catch(e => console.log('   submit KO', e.message.slice(0, 80)))
    const t = Date.now(); while (Date.now() - t < 20000) { await page.waitForTimeout(500); if ((await nb()) > avant) break }
    console.log('   DB:', JSON.stringify({ avant, apres: await nb(), derniere: await derniere() }))
  }
}
await browser.close(); await db.end()


