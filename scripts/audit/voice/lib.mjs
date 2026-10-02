// Outillage commun des sondes navigateur de l'audit VOIX (pile isolee : backend :4100, frontend :3001, base nopalou_audit).
// Seul le MOTEUR DE TRANSCRIPTION est simule (SpeechRecognition factice) : tout le reste (permission micro, createVoiceListener,
// parseurs, hooks React, formulaires, server actions, backend Express, PostgreSQL) est le code reel de Nopalou.
import { chromium } from 'playwright'
import pg from 'pg'

export const FRONT = 'http://localhost:3001'
export const BACK = 'http://localhost:4100'
export const PW = 'Audit!Pass2026x'

export function garde() {
  const u = process.env.DATABASE_URL || ''
  if (!/127\.0\.0\.1|localhost/.test(u) || /render\.com/.test(u)) throw new Error('GARDE : DATABASE_URL non locale. Faire d\'abord  . scripts\\audit\\audit-env.ps1')
}

export async function api(method, url, body, token) {
  const r = await fetch(BACK + url, { method, headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined })
  const t = await r.text(); let d; try { d = JSON.parse(t) } catch { d = t }
  return { s: r.status, d }
}

export async function seedUser(tag = 'voice') {
  const email = `${tag}@audit.test`
  let r = await api('POST', '/api/auth/inscription', { nom: `Testeur ${tag}`, email, mot_de_passe: PW })
  if (r.s !== 201) r = await api('POST', '/api/auth/connexion', { email, mot_de_passe: PW })
  const token = r.d.token, uid = r.d.user && r.d.user.id
  if (!token) throw new Error('seed: pas de token ' + JSON.stringify(r.d).slice(0, 200))
  const act = await api('POST', '/api/kalpe/activer', {}, token)
  return { email, token, uid, activerKalpe: act.s }
}

export function pool() { return new pg.Pool({ connectionString: process.env.DATABASE_URL }) }

// Faux SpeechRecognition injecte avant tout script de la page. Configuration par window.__VOICE (lue au start()).
export const INIT_SCRIPT = () => {
  window.__voiceLog = []
  class FakeRec {
    constructor() { this.lang = ''; this.continuous = undefined; this.interimResults = undefined; this.maxAlternatives = 1; window.__lastRec = this }
    start() {
      const cfg = window.__VOICE || {}
      window.__voiceLog.push({ ev: 'start', lang: this.lang, continuous: this.continuous, interim: this.interimResults, maxAlt: this.maxAlternatives, t: Date.now() })
      if (cfg.startThrows) { const e = new Error('InvalidStateError'); e.name = cfg.startThrows; throw e }
      setTimeout(() => this.onstart && this.onstart(), 5)
      const d = cfg.delay ?? 250
      this._timer = setTimeout(() => {
        if (cfg.error) { this.onerror && this.onerror({ error: cfg.error }); this.onend && this.onend(); return }
        if (cfg.silence) { this.onend && this.onend(); return }
        const alts = cfg.alts || ['']
        const res = [alts.map(t => ({ transcript: t, confidence: 0.9 }))]
        window.__voiceLog.push({ ev: 'result', alts, t: Date.now() })
        this.onresult && this.onresult({ results: res })
        this.onend && this.onend()
        if (cfg.autoSubmitAfterMs != null) setTimeout(() => { const f = [...document.querySelectorAll('form')].find(x => x.querySelector('input[type=number]') && /Valider|Enregistrement/.test(x.innerText)); const b = f && [...f.querySelectorAll('button[type=submit]')].find(x => /Valider/.test(x.innerText)); window.__voiceLog.push({ ev: 'autosubmit', trouve: !!b, montantAuClic: f && f.querySelector('input[type=number]').value, t: Date.now() }); if (b) b.click() }, cfg.autoSubmitAfterMs)
      }, d)
    }
    stop() { window.__voiceLog.push({ ev: 'stop', t: Date.now() }); clearTimeout(this._timer); this.onend && this.onend() }
    abort() { this.stop() }
  }
  if (!window.__NO_SPEECH_API) { window.SpeechRecognition = FakeRec; window.webkitSpeechRecognition = FakeRec }
  const realGUM = navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) : null
  if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async (c) => {
    window.__voiceLog.push({ ev: 'getUserMedia', c })
    if (window.__MIC_DENY) { const e = new Error('Permission denied'); e.name = window.__MIC_DENY; throw e }
    return realGUM ? realGUM(c) : new MediaStream()
  }
}

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ETAT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '.local') // ignore par git
export const etatSession = email => path.join(ETAT_DIR, 'session-' + email.replace(/[^a-z0-9]/gi, '_') + '.json')

export async function ouvrirNavigateur({ headless = true, viewport = { width: 414, height: 860 }, email = null } = {}) {
  const browser = await chromium.launch({ headless, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] })
  const storageState = email && fs.existsSync(etatSession(email)) ? etatSession(email) : undefined // la limite de connexions (15 min) interdit de se reconnecter a chaque sonde
  const context = await browser.newContext({ viewport, permissions: ['microphone'], locale: 'fr-FR', isMobile: true, hasTouch: true, storageState })
  // f8649ede : écran d'information unique avant la première demande du micro ; les sondes le considèrent déjà accepté
  // (VOICE_SANS_CONSENTEMENT=1 pour tester l'écran lui-même)
  if (!process.env.VOICE_SANS_CONSENTEMENT) await context.addInitScript(() => { try { localStorage.setItem('nopalou_voice_consent_v1', '1') } catch {} })
  await context.route('**/*', route => {
    const h = new URL(route.request().url()).hostname
    if (h === 'localhost' || h === '127.0.0.1') return route.continue()
    return route.abort() // aucun appel externe (GTM, fonts, CDN) pendant l'audit
  })
  await context.addInitScript(INIT_SCRIPT)
  const page = await context.newPage()
  page.setDefaultTimeout(120000)
  return { browser, context, page }
}

export async function connexionUI(page, email) {
  // Session deja enregistree par une sonde precedente : on la reutilise (la limite de connexions du backend est de quelques essais / 15 min).
  if (fs.existsSync(etatSession(email))) {
    await page.goto(FRONT + '/compte', { waitUntil: 'commit', timeout: 60000 }).catch(() => {})
    await page.waitForTimeout(3000)
    if (!new URL(page.url()).pathname.startsWith('/connexion')) return
  }
  await page.goto(FRONT + '/connexion', { waitUntil: 'commit' })
  // L'onglet par defaut est WhatsApp ; un clic avant l'hydratation React est perdu : on reessaie jusqu'a voir le champ email.
  for (let i = 0; i < 40; i++) {
    await page.click('button[role=tab]:has-text("Email")').catch(() => {})
    if (await page.waitForSelector('input[name=email]', { timeout: 1500 }).catch(() => null)) break
  }
  await page.fill('input[name=email]', email)
  await page.fill('input[name=password]', PW)
  await Promise.all([page.waitForURL(u => !u.pathname.startsWith('/connexion'), { timeout: 120000, waitUntil: 'commit' }), page.click('button.auth-submit-btn[type=submit]')])
  fs.mkdirSync(ETAT_DIR, { recursive: true }); await page.context().storageState({ path: etatSession(email) })
}

// Etat observable du formulaire de la modale Sama Xaalis.
export const LIRE_FORM_KALPE = () => {
  const modal = [...document.querySelectorAll('form')].find(f => f.querySelector('input[type=number]') && /Valider|Enregistrement/.test(f.innerText))
  if (!modal) return { ouvert: false }
  const montant = modal.querySelector('input[type=number]')?.value ?? null
  const inputsTexte = [...modal.querySelectorAll('input[type=text]')]
  const libelle = inputsTexte.find(i => /^Ex: (Déjeuner|Robe)/.test(i.placeholder))?.value ?? null
  const tiersNom = inputsTexte.find(i => /Moussa|École|Senelec/.test(i.placeholder))?.value ?? null
  const txt = modal.innerText
  const mode = /Sens de la créance/.test(txt) ? 'dette' : /objectif d'épargne/.test(txt) ? 'epargne' : modal.querySelector('button')?.innerText && /Salaire & Emploi/.test(txt) ? 'revenu' : /Alimentation & Marché/.test(txt) ? 'depense' : 'vente_express'
  const cat = [...modal.querySelectorAll('button')].filter(b => getComputedStyle(b).backgroundColor === 'rgb(28, 43, 74)').map(b => b.innerText.trim())
  const sens = [...modal.querySelectorAll('button')].filter(b => /^(On me doit|Je dois)/.test(b.innerText.trim()) && getComputedStyle(b).borderTopWidth === '1.5px').map(b => b.innerText.trim())
  const toasts = [...document.querySelectorAll('.npl-toast-item')].map(t => t.innerText.replace(/\s+/g, ' ').trim())
  const retour = [...document.querySelectorAll('form ~ *, form *')].map(e => e.innerText).find(t => /^(Reconnu|Écoute|Aucune voix|Aucun micro|Micro|Erreur réseau|La reconnaissance)/.test((t || '').trim()))
  const nbModales = [...document.querySelectorAll('form')].filter(f => f.querySelector('input[type=number]') && /Valider|Enregistrement/.test(f.innerText)).length
  return { ouvert: true, nbModales, mode, montant, libelle, tiersNom, categorieSelectionnee: cat, sens, toasts, retourVocal: retour ? retour.trim().slice(0, 140) : null }
}







