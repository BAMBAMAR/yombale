// Sonde AUDIT VOIX n°4 : caisse POS (PosVoiceInput -> panier). Mesure quantite, total et message affiches pour chaque dictee.
// Usage : . scripts\audit\audit-env.ps1 ; node scripts/audit/voice/04-e2e-pos.mjs   (amorcer d'abord avec 03-seed-boutique.mjs)
import fs from 'node:fs'
import { garde, ouvrirNavigateur, connexionUI, FRONT } from './lib.mjs'
garde()
const OUT = process.env.VOICE_OUT
const { browser, page } = await ouvrirNavigateur({ viewport: { width: 1280, height: 900 }, email: 'voiceb@audit.test' })
page.on('pageerror', e => console.log('  [pageerror]', e.message.slice(0, 160)))
await connexionUI(page, 'voiceb@audit.test')


// Deverrouillage de la caisse : configuration obligatoire des PIN, puis choix du profil gerant + saisie du PIN.
async function ouvrirCaisse() {
  await page.goto(FRONT + '/boutique/caisse', { waitUntil: 'commit', timeout: 150000 })
  for (let i = 0; i < 40; i++) {
    const txt = await page.innerText('body').catch(() => '')
    if (/Caf[ée] Touba/.test(txt) && !/Qui encaisse aujourd/.test(txt)) return true
    const plusTard = await page.$('button:has-text("Configurer plus tard")')
    if (plusTard) {
      await plusTard.click().catch(() => {})
    } else if (/Qui encaisse aujourd/.test(txt)) {
      await page.click('button:has-text("Gérant Testeur voiceb")').catch(() => {})
      const champ = await page.$('input[aria-label="Code PIN de déverrouillage"]')
      if (champ) { try { await champ.fill('9999'); await champ.press('Enter') } catch { /* le champ disparait des que le PIN est accepte */ } }
    }
    await page.waitForTimeout(2000)
  }
  console.log('CAISSE NON OUVERTE :', (await page.innerText('body')).replace(/\n+/g, ' | ').slice(0, 400))
  return false
}
const LIRE = () => {
  const txt = document.body.innerText.split('\n').map(s => s.trim()).filter(Boolean)
  const encaisser = txt.find(l => /^Encaisser/.test(l)) || null
  const lignes = txt.filter(l => /Caf[ée] Touba|Article (Vocal|Comptoir)|Riz parfum|Sucre|Vente libre/i.test(l) && l.length < 80)
  const bulle = [...document.querySelectorAll('div')].map(d => d.innerText).find(t => /^(✓ Ajouté|✓ Ajout Vente|🎤 Entendu|Erreur micro)/.test((t || '').trim()))
  const qte = [...document.querySelectorAll('[class*=panier] *, aside *')].map(e => e.innerText).filter(t => /^\d{1,5}$/.test((t || '').trim())).slice(0, 6)
  return { encaisser, lignes: lignes.slice(0, 8), bulle: bulle ? bulle.trim().slice(0, 140) : null, qte }
}

const phrases = [
  '2 Café Touba', 'un café touba', 'trois sucres', '5000 FCFA', 'cinq mille francs', '10 mille', 'ñaari junni', 'mille francs',
  'café touba 1000', 'vente 2500', 'riz parfumé', 'bonjour', '', 'deux mille cinq cents francs',
]
const resultats = []
const montant = s => { const m = (s || '').replace(/[  \s]/g, '').match(/(\d+)FCFA/); return m ? Number(m[1]) : 0 }
if (!(await ouvrirCaisse())) process.exit(2)
await page.waitForTimeout(1500)
for (const ph of phrases) {
  await page.evaluate(v => { window.__VOICE = { alts: [v], delay: 200 }; window.__voiceLog.length = 0 }, ph)
  const btn = await page.$('button[title*="Assistant vocal caisse"]')
  if (!btn) { console.log(`### « ${ph} » BOUTON VOCAL ABSENT`); resultats.push({ phrase: ph, absent: true }); continue }
  const avant = montant((await page.evaluate(LIRE)).encaisser)
  await btn.evaluate(b => b.click()) // un panneau d'ouverture de caisse recouvre le bouton : on declenche le gestionnaire React directement
  await page.waitForTimeout(1300)
  const apres = await page.evaluate(LIRE)
  const lang = await page.evaluate(() => window.__voiceLog.filter(e => e.ev === 'start').map(e => e.lang))
  const delta = montant(apres.encaisser) - avant
  console.log(`### « ${ph} » -> panier ${avant} -> ${montant(apres.encaisser)} FCFA (delta ${delta}) | message : ${apres.bulle} | lang=${JSON.stringify(lang)}`)
  resultats.push({ phrase: ph, avant, apres: montant(apres.encaisser), delta, message: apres.bulle })
  if (ph === 'cinq mille francs') await page.screenshot({ path: (process.env.VOICE_SHOT || 'pos-cinq-mille.png') })
  await page.waitForTimeout(3500) // laisse disparaitre la bulle
}
if (OUT) fs.writeFileSync(OUT, JSON.stringify(resultats, null, 1))
await browser.close()






