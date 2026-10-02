// Sonde AUDIT VOIX n°5 : Carnet de dettes boutique (useCarnetVoice -> CarnetVoiceActionPrompt -> POST transaction -> PostgreSQL).
// Usage : . scripts\audit\audit-env.ps1 ; node scripts/audit/voice/05-e2e-carnet.mjs   (amorcer avec 03-seed-boutique.mjs)
import { garde, ouvrirNavigateur, connexionUI, pool, FRONT } from './lib.mjs'
garde()
const db = pool()
const u = (await db.query("SELECT id FROM utilisateurs WHERE email='voiceb@audit.test'")).rows[0]
const bq = (await db.query('SELECT id FROM boutiques WHERE utilisateur_id=$1 LIMIT 1', [u.id])).rows[0]
const { browser, page } = await ouvrirNavigateur({ viewport: { width: 414, height: 860 }, email: 'voiceb@audit.test' })
page.on('pageerror', e => console.log('  [pageerror]', e.message.slice(0, 160)))
console.log('connexion...'); await connexionUI(page, 'voiceb@audit.test'); console.log('connecte')

const soldes = async () => Object.fromEntries((await db.query('SELECT nom, solde::int AS solde FROM caisse_clients_credits WHERE boutique_id=$1 ORDER BY nom', [bq.id])).rows.map(r => [r.nom, r.solde]))
const nbHist = async () => Number((await db.query('SELECT count(*) FROM caisse_credit_historique WHERE boutique_id=$1', [bq.id])).rows[0].count)
const dernier = async () => (await db.query('SELECT type, montant::int AS montant, note, mode_paiement FROM caisse_credit_historique WHERE boutique_id=$1 ORDER BY created_at DESC LIMIT 1', [bq.id])).rows[0]

const LIRE = () => {
  const bandeau = [...document.querySelectorAll('div')].find(d => /Action Vocale Détectée/.test(d.innerText) && d.innerText.length < 900)
  const boutons = [...document.querySelectorAll('button')].map(b => b.innerText.trim()).filter(t => /Enregistrer la dette|Valider le versement|Créer la fiche|Modifier/.test(t))
  const disabled = [...document.querySelectorAll('button')].filter(b => /Enregistrer la dette|Valider le versement/.test(b.innerText)).map(b => b.disabled)
  const sel = document.querySelector('select')
  const montant = [...document.querySelectorAll('input[type=number]')].map(i => i.value)
  const feedback = [...document.querySelectorAll('div,span,p')].map(e => e.innerText).find(t => /^(Fiche de|Aucun client trouvé|Dette de|Remboursement de|Écoute|Aucune voix)/.test((t || '').trim()) && t.length < 160)
  return { prompt: bandeau ? bandeau.innerText.replace(/\s+/g, ' ').slice(0, 330) : null, boutons, disabled, selectAffiche: sel ? sel.options[sel.selectedIndex]?.text : null, montantsChamps: montant, feedback: feedback ? feedback.trim() : null }
}

const S = [
  ['C01', 'Dette Moussa 10 000', true],
  ['C02', 'Moussa a payé 5000', true],
  ['C03', 'Fatou me doit 7500', true],
  ['C04', 'Dette Aminata 8000', false],
  ['C05', 'Remboursement Aminata 5000', false],
  ['C06', 'Moussa Diop', false],
  ['C07', 'Dette Moussa', false],
  ['C08', 'dette 5000', false],
  ['C09', 'bonjour', false],
  ['C10', 'Moussa a payé cinq mille', true],
  ['C11', 'Fatou doit trois mille cinq cents', true],
  ['C12', 'Moussa 5000', false],
]
for (const [id, phrase, valider] of S) {
  if (process.env.VOICE_FILTRE && !process.env.VOICE_FILTRE.split(',').includes(id)) continue
  await page.goto(FRONT + '/boutique?manage=' + bq.id + '&tab=carnet', { waitUntil: 'commit' })
  await page.waitForFunction(() => /Moussa Diop/.test(document.body.innerText), null, { timeout: 150000 }).catch(() => {})
  await page.waitForTimeout(1200)
  await page.evaluate(v => { window.__VOICE = { alts: [v], delay: 200 }; window.__voiceLog.length = 0 }, phrase)
  const btn = await page.$('button[title^="Dicter une dette"], button[title="Arrêter l\'écoute"], button:has-text("Vocal")')
  if (!btn) { console.log(`### ${id} « ${phrase} » BOUTON ABSENT`); continue }
  const avant = { soldes: await soldes(), hist: await nbHist() }
  await btn.click()
  await page.waitForTimeout(1200)
  const ui = await page.evaluate(LIRE)
  console.log(`### ${id} « ${phrase} »\n   UI: ${JSON.stringify(ui)}`)
  if (valider && ui.boutons.some(b => /Enregistrer la dette|Valider le versement/.test(b))) {
    await page.click('button:has-text("Enregistrer la dette"), button:has-text("Valider le versement")')
    let t = Date.now(); while (Date.now() - t < 20000) { await page.waitForTimeout(500); if ((await nbHist()) > avant.hist) break }
    console.log(`   DB: soldes ${JSON.stringify(avant.soldes)} -> ${JSON.stringify(await soldes())} ; derniere ligne ${JSON.stringify(await dernier())}`)
  }
}
await browser.close(); await db.end()




