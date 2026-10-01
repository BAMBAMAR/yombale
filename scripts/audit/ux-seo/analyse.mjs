import fs from 'node:fs'
const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const short = (s, n = 70) => (s == null ? '-' : s.length > n ? s.slice(0, n) + '…' : s)
console.log('N=', rows.length)
console.log('\n=== STATUTS non-200')
for (const r of rows.filter(r => r.status !== 200)) console.log(r.status ?? r.err, r.p, r.loc ? '-> ' + r.loc : '', r.xrobots ? 'xrobots=' + r.xrobots : '')
console.log('\n=== TABLE (200) : path | title(len) | desc(len) | canon | robots | h1 | ld | words | ms')
for (const r of rows.filter(r => r.status === 200)) {
  const canon = r.canonical ? r.canonical.replace(/^https?:\/\/[^/]+/, '') || '/' : 'NONE'
  const canonFlag = r.canonical ? (canon === r.p.split('?')[0] ? 'self' : canon) : 'NONE'
  console.log([r.p, `${short(r.title, 80)} (${r.title ? r.title.length : 0})`, `(${r.desc ? r.desc.length : 0})`, canonFlag, r.robots || '-', `h1=${r.h1.length}:${short(r.h1[0], 50)}`, (r.ld || []).join(';'), r.words, r.ms].join(' | '))
}
console.log('\n=== TITRES dupliques "| Nopalou | Nopalou"')
for (const r of rows.filter(r => r.title && /Nopalou.*Nopalou/.test(r.title))) console.log(r.p, '=>', r.title)
console.log('\n=== TITRES > 65 car.')
for (const r of rows.filter(r => r.title && r.title.length > 65)) console.log(r.title.length, r.p, short(r.title, 120))
console.log('\n=== DESC absente ou <70 ou >165')
for (const r of rows.filter(r => r.status === 200 && (!r.desc || r.desc.length < 70 || r.desc.length > 165))) console.log(r.desc ? r.desc.length : 'NONE', r.p)
console.log('\n=== H1 != 1')
for (const r of rows.filter(r => r.status === 200 && r.h1.length !== 1)) console.log(r.h1.length, r.p, JSON.stringify(r.h1.slice(0, 3)))
console.log('\n=== Canonical absent ou different')
for (const r of rows.filter(r => r.status === 200 && (!r.canonical || r.canonical.replace(/^https?:\/\/[^/]+/, '').split('?')[0] !== r.p.split('?')[0]))) console.log(r.p, '=>', r.canonical)
console.log('\n=== Titres identiques entre pages')
const byT = {}
for (const r of rows.filter(r => r.status === 200 && r.title)) (byT[r.title] ||= []).push(r.p)
for (const [t, ps] of Object.entries(byT)) if (ps.length > 1) console.log(ps.length, short(t, 90), ps.slice(0, 5).join(' , '))
console.log('\n=== Descriptions identiques')
const byD = {}
for (const r of rows.filter(r => r.status === 200 && r.desc)) (byD[r.desc] ||= []).push(r.p)
for (const [t, ps] of Object.entries(byD)) if (ps.length > 1) console.log(ps.length, short(t, 90), ps.slice(0, 5).join(' , '))
console.log('\n=== Pages minces (<250 mots) 200')
for (const r of rows.filter(r => r.status === 200 && r.words < 250)) console.log(r.words, r.p)
console.log('\n=== og:image absent')
for (const r of rows.filter(r => r.status === 200 && !r.ogImage)) console.log(r.p)
console.log('\n=== lang')
console.log([...new Set(rows.map(r => r.lang))])
