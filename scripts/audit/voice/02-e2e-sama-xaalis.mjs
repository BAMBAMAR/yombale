// Sonde AUDIT VOIX n°2 : chaine complete Sama Xaalis dans un vrai navigateur (Chromium, viewport mobile 414x860), pile isolee.
//   transcription simulee -> createVoiceListener -> parseurs -> setters -> etat React -> DOM -> validation -> server action -> backend -> PostgreSQL
// Usage : . scripts\audit\audit-env.ps1 ; node scripts/audit/voice/02-e2e-sama-xaalis.mjs [sortie.json] [filtreId]
import fs from 'node:fs'
import { garde, seedUser, ouvrirNavigateur, connexionUI, pool, FRONT, LIRE_FORM_KALPE } from './lib.mjs'

garde()
const OUT = process.env.VOICE_OUT
const FILTRE = process.env.VOICE_FILTRE
const user = await seedUser('voicek')
const db = pool()
const { browser, page } = await ouvrirNavigateur({ email: 'voicek@audit.test' })
const posts = []
let tClick = 0
page.on('request', r => { if (r.method() === 'POST' && r.headers()['next-action']) posts.push(Date.now() - tClick) })
page.on('pageerror', e => console.log('  [pageerror]', e.message.slice(0, 160)))
await connexionUI(page, user.email)

async function nbOps() { return Number((await db.query('SELECT count(*) FROM kalpe_operations WHERE utilisateur_id=$1', [user.uid])).rows[0].count) }
async function nbDettes() { return Number((await db.query('SELECT count(*) FROM kalpe_dettes WHERE utilisateur_id=$1', [user.uid])).rows[0].count) }
async function derniereOp() { return (await db.query('SELECT type,direction,montant::int AS montant,categorie,libelle,contexte,date_operation::text,metadata FROM kalpe_operations WHERE utilisateur_id=$1 ORDER BY created_at DESC LIMIT 1', [user.uid])).rows[0] }
async function derniereDette() { return (await db.query('SELECT direction,tiers_nom,tiers_telephone,tiers_type,montant_initial::int AS montant,date_echeance::text,note FROM kalpe_dettes WHERE utilisateur_id=$1 ORDER BY created_at DESC LIMIT 1', [user.uid])).rows[0] }

async function scenario(s) {
  if (FILTRE && !FILTRE.split(',').some(p => s.id.startsWith(p))) return null
  posts.length = 0
  await page.goto(FRONT + '/compte?tab=kalpe', { waitUntil: 'commit' })
  await page.evaluate(v => { window.__VOICE = v.voice; window.__MIC_DENY = v.micDeny || null; window.__voiceLog.length = 0 }, { voice: s.voice, micDeny: s.micDeny })
  await page.waitForFunction(() => /Dicter/.test(document.body.innerText), null, { timeout: 120000 })
  await page.waitForTimeout(1500)
  if (s.pre) { // ouvre puis referme la modale dans un autre onglet de saisie (l'etat `mode` du composant reste celui-ci)
    await page.evaluate(a => window.dispatchEvent(new CustomEvent('sama-xaalis:action', { detail: { action: a } })), s.pre)
    await page.waitForSelector('button[type=submit]:has-text("Valider")')
    await page.mouse.click(200, 20) // clic sur le fond : ferme la modale
    await page.waitForTimeout(800)
  }
  await page.evaluate(a => window.dispatchEvent(new CustomEvent('sama-xaalis:action', { detail: { action: a } })), s.ui)
  await page.waitForSelector('button[type=submit]:has-text("Valider")')
  const avant = await nbOps(); const dettesAvant = await nbDettes()
  tClick = Date.now(); posts.length = 0
  if (s.manuel) {
    await page.fill('input[type=number]', s.manuel.montant)
    await page.fill('input[placeholder^="Ex: Déjeuner"]', s.manuel.libelle)
    tClick = Date.now()
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('nopalou:toast', { detail: { message: 'Notification quelconque (sonde)', type: 'info' } })))
  } else {
    await page.click('text=Dicter vocal')
  }
  const echantillons = []
  for (const t of s.sample || [150, 450, 900, 1600, 3000, 4600, 6500]) {
    const wait = t - (Date.now() - tClick); if (wait > 0) await page.waitForTimeout(wait)
    const etat = await page.evaluate(LIRE_FORM_KALPE)
    echantillons.push({ t, ...etat, rechargementsReseau: posts.length })
  }
  const log = await page.evaluate(() => window.__voiceLog)
  let db_ = null
  if (s.submit) {
    if (s.submit === 'tard') { await page.click('button[type=submit]:has-text("Valider")') }
    // Attend l'ecriture : les server actions sont serialisees par Next, la validation peut attendre derriere les rechargements.
    const tSub = Date.now(); let apres = avant
    while (Date.now() - tSub < 12000) { await page.waitForTimeout(500); apres = await nbOps(); if (s.ui === 'dette' ? (await nbDettes()) > dettesAvant : apres > avant) break }
    db_ = { opsAvant: avant, opsApres: apres, dettesAvant, dettesApres: await nbDettes(), latenceEcritureMs: Date.now() - tSub, derniere: (s.ui === 'dette' ? await derniereDette() : await derniereOp()) }
  }
  const res = { id: s.id, ui: s.ui, phrase: (s.voice.alts || [])[0] ?? null, voix: { error: s.voice.error, silence: s.voice.silence }, voiceLog: log.filter(e => e.ev === 'start' || e.ev === 'getUserMedia' || e.ev === 'autosubmit' || e.ev === 'result').map(e => e.ev === 'start' ? { lang: e.lang, continuous: e.continuous, interim: e.interim, maxAlt: e.maxAlt } : e.ev === 'autosubmit' ? { autosubmit: e.trouve, montantAuClic: e.montantAuClic } : e.ev === 'result' ? { result: true } : { gum: true }), echantillons, db: db_ }
  console.log(`\n### ${s.id} [${s.ui}] « ${res.phrase} »${s.voice.error ? ' ERREUR=' + s.voice.error : ''}${s.voice.silence ? ' SILENCE' : ''}`)
  for (const e of echantillons) console.log(`  t+${String(e.t).padStart(4)}ms mode=${e.mode} montant=${JSON.stringify(e.montant)} libelle=${JSON.stringify(e.libelle)} cat=${JSON.stringify(e.categorieSelectionnee)}${e.tiersNom != null ? ' tiers=' + JSON.stringify(e.tiersNom) : ''}${e.sens && e.sens.length ? ' sens=' + JSON.stringify(e.sens) : ''} reload=${e.rechargementsReseau} toasts=${JSON.stringify(e.toasts)} retour=${JSON.stringify(e.retourVocal)}`)
  if (s.voice.autoSubmitAfterMs != null || s.ui === 'dicter') console.log('  journal voix:', JSON.stringify(res.voiceLog))
  if (db_) console.log('  DB:', JSON.stringify(db_))
  return res
}

const V = (alts, extra = {}) => ({ alts: Array.isArray(alts) ? alts : [alts], ...extra })
const rapide = { submit: true }
const S = [
  // A. Le cas critique : transcription correcte, formulaire attendu rempli
  { id: 'K01-cas-critique-fab-dicter', ui: 'dicter', voice: V("J'ai dépensé 5000 francs pour le transport") },
  { id: 'K02-clic-bouton-dicter', ui: 'depense', voice: V("J'ai dépensé 5000 francs pour le transport") },
  { id: 'K03-temoin-sans-voix-un-toast-quelconque', ui: 'depense', voice: V('x'), manuel: { montant: '5000', libelle: 'Transport (saisi au clavier)' } },
  // B. Chaine aval, hors course contre le rechargement : validation a +30 ms
  { id: 'K04-valider-immediatement-depense', ui: 'depense', voice: V("J'ai dépensé 5000 francs pour le transport", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K05-revenu-salaire-onglet-revenu', ui: 'revenu', voice: V("Aujourd'hui j'ai reçu 25 000 francs de salaire", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K06-revenu-salaire-onglet-depense', ui: 'depense', voice: V("Aujourd'hui j'ai reçu 25 000 francs de salaire", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K07-depense-courte', ui: 'depense', voice: V('Dépense 5000 transport', { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K08-conversationnelle', ui: 'depense', voice: V("Ce matin j'ai payé 5000 FCFA de transport", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K09-dejeuner', ui: 'depense', voice: V("J'ai payé 3000 francs pour le déjeuner", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K10-montant-seul', ui: 'depense', voice: V("J'ai dépensé 5000 francs", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K11-ambigu-paye-5000', ui: 'depense', voice: V("J'ai payé 5000", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K12-montant-en-lettres-3500', ui: 'depense', voice: V("j'ai dépensé trois mille cinq cents francs au marché", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K13-deux-operations', ui: 'depense', voice: V("j'ai payé 5000 de transport et 2000 de déjeuner", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K14-vente-depuis-depense', ui: 'depense', voice: V('vente café touba 500', { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K15-epargne-dictee', ui: 'epargne', voice: V('je mets 10000 de côté pour mon voyage'), sample: [150, 450, 1200] },
  { id: 'K16-wolof-melange', ui: 'depense', voice: V('Dépense transport benn téemeer', { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K17-wolof-junni', ui: 'depense', voice: V('dépense ñaari junni loyer', { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'K18-phrase-incomprise', ui: 'depense', voice: V('bonjour tout le monde comment allez vous', { autoSubmitAfterMs: 30 }), sample: [150, 450, 1200] },
  { id: 'K19-phrase-longue-libelle-300', ui: 'depense', voice: V('j ai paye 5000 transport ' + 'taxi aeroport ville '.repeat(16), { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  // Etat perime : la modale a ete utilisee en mode dette, puis rouverte par le bouton FAB 'dicter' (onglet depense)
  { id: 'K20-etat-perime-apres-dette-puis-dicter', pre: 'dette', ui: 'dicter', voice: V("j'ai payé 5000 de transport"), sample: [150, 450, 900] },
  { id: 'K21-etat-perime-apres-revenu-puis-dicter', pre: 'revenu', ui: 'dicter', voice: V("j'ai payé 5000 de transport"), sample: [150, 450, 900] },
  { id: 'K22-date-paiement-contexte', ui: 'depense', voice: V("j'ai payé 5000 par Wave pour le transport hier pour ma boutique", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 900] },
  // C. Dettes
  { id: 'D01-je-dois-20000-a-moussa', ui: 'dette', voice: V('Je dois 20000 à Moussa', { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'D02-moussa-me-doit', ui: 'dette', voice: V('Moussa me doit 10000', { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'D03-remboursement', ui: 'dette', voice: V("Awa m'a remboursé 5000", { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'D04-telephone-et-echeance', ui: 'dette', voice: V('Moussa Diop 77 123 45 67 me doit 10000 avant vendredi', { autoSubmitAfterMs: 30 }), submit: true, sample: [150, 450, 1200] },
  { id: 'D05-incompris', ui: 'dette', voice: V('hum euh', {}), sample: [150, 450, 1200] },
  // D. Erreurs et robustesse
  { id: 'E01-silence-no-speech', ui: 'depense', voice: V('', { error: 'no-speech' }), sample: [150, 450, 1200] },
  { id: 'E02-fin-sans-resultat-ni-erreur', ui: 'depense', voice: V('', { silence: true }), sample: [150, 450, 1200] },
  { id: 'E03-erreur-reseau-asr', ui: 'depense', voice: V('', { error: 'network' }), sample: [150, 450, 1200] },
  { id: 'E04-micro-refuse-reco', ui: 'depense', voice: V('', { error: 'not-allowed' }), sample: [150, 450, 1200] },
  { id: 'E05-aucun-micro', ui: 'depense', voice: V('', { error: 'audio-capture' }), sample: [150, 450, 1200] },
  { id: 'E06-langue-non-supportee', ui: 'depense', voice: V('', { error: 'language-not-supported' }), sample: [150, 450, 1200] },
  { id: 'E07-aborted', ui: 'depense', voice: V('', { error: 'aborted' }), sample: [150, 450, 1200] },
  { id: 'E08-permission-getUserMedia-refusee', ui: 'depense', voice: V('x'), micDeny: 'NotAllowedError', sample: [150, 450, 1200] },
  { id: 'E09-micro-absent-getUserMedia', ui: 'depense', voice: V('x'), micDeny: 'NotFoundError', sample: [150, 450, 1200] },
  { id: 'E10-start-leve-InvalidStateError', ui: 'depense', voice: V('x', { startThrows: 'InvalidStateError' }), sample: [150, 450, 1200] },
  { id: 'E11-transcription-vide', ui: 'depense', voice: V(''), sample: [150, 450, 1200] },
]
const resultats = []
for (const s of S) { try { const r = await scenario(s); if (r) resultats.push(r) } catch (e) { console.log(`### ${s.id} EXCEPTION`, e.message.slice(0, 200)); resultats.push({ id: s.id, exception: e.message }) } }
if (OUT) fs.writeFileSync(OUT, JSON.stringify(resultats, null, 1))
await browser.close(); await db.end()







