// Sonde UX en lecture seule contre la pile locale. Toute requete hors boucle locale est bloquee dans le navigateur.
const path = require('path')
const fs = require('fs')
const { chromium } = require(path.join(__dirname, '../../../node_modules/playwright'))
const BASE = 'http://localhost:3001'
const OUT = process.argv[3]
const pages = JSON.parse(fs.readFileSync(process.argv[2], 'utf8').replace(/^\uFEFF/, ''))
const viewports = [{ n: 'mobile', w: 375, h: 812 }, { n: 'desktop', w: 1366, h: 800 }]
;(async () => {
  const browser = await chromium.launch()
  const results = []
  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, locale: 'fr-FR', deviceScaleFactor: 1, hasTouch: vp.n === 'mobile', isMobile: vp.n === 'mobile' })
    await ctx.route('**/*', route => { const u = route.request().url(); if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u) || u.startsWith('data:') || u.startsWith('blob:')) route.continue(); else route.abort() })
    for (const p of pages) {
      const page = await ctx.newPage()
      const errs = []; const failed = []
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)) })
      page.on('requestfailed', r => { const u = r.url(); if (/localhost|127\.0\.0\.1/.test(u)) failed.push(u.slice(0, 120)) })
      let status = null
      try {
        const r = await page.goto(BASE + p, { waitUntil: 'load', timeout: 90000 }); status = r && r.status()
        await page.waitForTimeout(1200)
        const m = await page.evaluate((vw) => {
          const vh = window.innerHeight
          const visible = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
          const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth
          const overflowers = []
          document.querySelectorAll('body *').forEach(e => { if (!visible(e)) return; const r = e.getBoundingClientRect(); if (r.right > vw + 2 && r.width < vw * 3) { let a = e, hidden = false; while (a && a !== document.body) { const s = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(s.overflowX) && a !== e && a.getBoundingClientRect().right <= vw + 2) { hidden = true; break } a = a.parentElement } if (!hidden) overflowers.push((e.tagName + '.' + (e.className && e.className.toString().slice(0, 40)) + ' "' + (e.textContent || '').trim().slice(0, 30) + '"')) } })
          const trunc = []
          document.querySelectorAll('a,button,h1,h2,h3,p,span,div,li').forEach(e => { if (!visible(e)) return; const s = getComputedStyle(e); if (s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1 && (e.textContent || '').trim().length > 2) trunc.push((e.textContent || '').trim().slice(0, 60)) })
          const small = []
          document.querySelectorAll('a[href],button,input,select,textarea,[role=button]').forEach(e => { if (!visible(e)) return; const r = e.getBoundingClientRect(); if (r.top < vh * 3 && (r.height < 32 || r.width < 32) && (e.textContent || e.getAttribute('aria-label') || '').trim().length) small.push(((e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30)) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)) })
          const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
          const emoji = []
          document.querySelectorAll('h1,h2,h3,button,a,label,span').forEach(e => { if (!visible(e) || e.children.length > 2) return; const t = (e.textContent || '').trim(); if (t.length < 80 && emojiRe.test(t)) emoji.push(t.slice(0, 40)) })
          const ctas = []
          document.querySelectorAll('a[href],button').forEach(e => { if (!visible(e)) return; const r = e.getBoundingClientRect(); if (r.top >= 0 && r.bottom <= vh) ctas.push((e.textContent || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 28)) })
          const h1 = [...document.querySelectorAll('h1')].filter(visible).map(e => e.textContent.trim().slice(0, 70))
          const mains = document.querySelectorAll('main').length
          return { docOverflow, overflowers: overflowers.slice(0, 6), trunc: [...new Set(trunc)].slice(0, 8), small: [...new Set(small)].slice(0, 10), nSmall: small.length, emoji: [...new Set(emoji)].slice(0, 8), ctasAboveFold: [...new Set(ctas)].slice(0, 25), nCtaFold: ctas.length, h1, mains, height: document.documentElement.scrollHeight }
        }, vp.w)
        const shot = path.join(path.dirname(OUT), 'shots'); fs.mkdirSync(shot, { recursive: true })
        await page.screenshot({ path: path.join(shot, vp.n + '_' + (p.replace(/[^a-z0-9]+/gi, '_') || 'home') + '.png'), fullPage: false })
        results.push({ vp: vp.n, p, status, errs: errs.slice(0, 5), failed: failed.slice(0, 5), ...m })
      } catch (e) { results.push({ vp: vp.n, p, status, error: String(e.message).slice(0, 160) }) }
      await page.close()
    }
    await ctx.close()
  }
  await browser.close()
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1))
  console.log('done', results.length)
})()

