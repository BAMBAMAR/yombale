// Sonde SEO en lecture seule contre la pile locale isolee (localhost:3001). Aucun appel externe.
import fs from 'node:fs'
const BASE = 'http://localhost:3001'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const paths = JSON.parse(fs.readFileSync(process.argv[2], 'utf8').replace(/^﻿/, ''))
const out = []
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
const get = (re, s) => { const m = re.exec(s); return m ? m[1].replace(/\s+/g, ' ').trim() : null }
async function one(p) {
  const t0 = Date.now()
  let r
  try { r = await fetch(BASE + p, { headers: { 'user-agent': UA, 'accept-language': 'fr' }, redirect: 'manual', signal: AbortSignal.timeout(120000) }) }
  catch (e) { return { p, err: String(e.message || e) } }
  const status = r.status
  const loc = r.headers.get('location')
  const xrobots = r.headers.get('x-robots-tag')
  const html = status < 300 || status === 404 ? await r.text() : ''
  const head = html.split('</head>')[0] || ''
  const body = html
  const h1 = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => strip(m[1]))
  const h2 = [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => strip(m[1])).slice(0, 12)
  const ld = [...body.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(m => { try { const j = JSON.parse(m[1]); return (Array.isArray(j) ? j : [j]).map(x => x['@type'] + (x['@graph'] ? '[graph:' + x['@graph'].map(g => g['@type']).join(',') + ']' : '')).join('|') } catch { return 'INVALID_JSON' } })
  const links = [...body.matchAll(/<a [^>]*href="([^"#]+)"/gi)].map(m => m[1])
  const internal = links.filter(l => l.startsWith('/') && !l.startsWith('//'))
  const text = strip(body)
  return {
    p, status, loc, xrobots, ms: Date.now() - t0,
    title: get(/<title[^>]*>([\s\S]*?)<\/title>/i, head),
    desc: get(/<meta name="description" content="([^"]*)"/i, head),
    canonical: get(/<link rel="canonical" href="([^"]*)"/i, head),
    robots: get(/<meta name="robots" content="([^"]*)"/i, head),
    ogTitle: get(/<meta property="og:title" content="([^"]*)"/i, head),
    ogImage: get(/<meta property="og:image" content="([^"]*)"/i, head),
    lang: get(/<html[^>]*lang="([^"]*)"/i, html),
    h1, h2, ld, nInternal: internal.length, nExternal: links.filter(l => /^https?:/.test(l)).length,
    words: text.split(' ').length,
    sample: text.slice(0, 260),
  }
}
const conc = 4
let i = 0
await Promise.all(Array.from({ length: conc }, async () => { while (i < paths.length) { const p = paths[i++]; out.push(await one(p)); process.stderr.write('.') } }))
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1))
console.log('done', out.length)
