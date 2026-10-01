import fs from 'node:fs'
const paths = JSON.parse(fs.readFileSync(process.argv[2], 'utf8').replace(/^﻿/, ''))
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
for (const p of paths) {
  try {
    const r = await fetch('http://localhost:3001' + p, { headers: { 'user-agent': UA }, redirect: 'manual', signal: AbortSignal.timeout(60000) })
    const t = await r.text()
    const robots = (/<meta name="robots" content="([^"]*)"/.exec(t) || [])[1]
    const title = (/<title[^>]*>([\s\S]*?)<\/title>/.exec(t) || [])[1]
    const canon = (/<link rel="canonical" href="([^"]*)"/.exec(t) || [])[1]
    console.log(r.status, p, '| loc=' + (r.headers.get('location') || '-'), '| robots=' + (robots || '-'), '| xrobots=' + (r.headers.get('x-robots-tag') || '-'), '| canon=' + (canon || '-'), '| title=' + (title || '-').slice(0, 60), '| cc=' + (r.headers.get('cache-control') || '-'))
  } catch (e) { console.log('ERR', p, e.message) }
}
