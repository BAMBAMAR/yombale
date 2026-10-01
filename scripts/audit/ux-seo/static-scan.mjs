import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../frontend-next/src/app')
const out = []
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name === 'page.tsx') {
      const c = fs.readFileSync(p, 'utf8')
      const dir = path.dirname(p)
      let lay = ''
      // layout metadata in the same dir or any ancestor below root
      let cur = dir
      while (cur.length >= root.length) {
        const lp = path.join(cur, 'layout.tsx')
        if (fs.existsSync(lp)) lay += fs.readFileSync(lp, 'utf8')
        if (cur === root) break
        cur = path.dirname(cur)
      }
      const rel = path.relative(root, p).replace(/\\/g, '/')
      const meta = /export (const metadata|async function generateMetadata|function generateMetadata)/.test(c)
      const layMeta = /export (const metadata|async function generateMetadata|function generateMetadata)/.test(lay.replace(/export const metadata[\s\S]{0,0}/, ''))
      out.push({
        page: rel, meta, layMeta, client: /^\s*['"]use client['"]/.test(c),
        canon: /canonical/.test(c), ld: /JsonLd|ld\+json/.test(c), h1: (c.match(/<h1/g) || []).length,
        noindex: /index:\s*false|noindex/.test(c), lines: c.split('\n').length,
      })
    }
  }
}
walk(root)
const pub = out.filter(r => !/^(admin|boutique\/|agence\/\[|\(account\)|pos|api)/.test(r.page))
console.log('total pages', out.length, 'public-ish', pub.length)
console.log('--- sans metadata propre ni layout metadata (public)')
for (const r of pub.filter(r => !r.meta && !r.layMeta)) console.log(r.page, r.client ? '[client]' : '', 'h1=' + r.h1)
console.log('--- avec metadata mais sans canonical (public)')
for (const r of pub.filter(r => r.meta && !r.canon)) console.log(r.page, 'h1=' + r.h1, r.ld ? 'ld' : 'no-ld')
console.log('--- h1 count != 1 (public, hors client)')
for (const r of pub.filter(r => r.h1 !== 1)) console.log(r.page, 'h1=' + r.h1)
console.log('--- noindex declare')
for (const r of out.filter(r => r.noindex)) console.log(r.page)

