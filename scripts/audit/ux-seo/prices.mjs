const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36'
const strip = h => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#x27;/g, ' ').replace(/\s+/g, ' ')
for (const p of ['/', '/marchands', '/tarifs-boutique', '/creer-boutique', '/promo', '/logiciel-caisse-senegal', '/vendre-sur-whatsapp', '/pourquoi-nopalou', '/guide-forfait', '/assistant-whatsapp']) {
  const r = await fetch('http://localhost:3001' + p, { headers: { 'user-agent': UA } })
  const t = strip(await r.text())
  const m = new Set()
  for (const x of t.matchAll(/(.{40})((?:\d[\d\s.,]*)\s?(?:FCFA|F CFA|F\/mois|F ?\/ ?mois|CFA)(?:\s?\/\s?mois)?)(.{0,25})/g)) m.add((x[1].slice(-30) + '[' + x[2] + ']' + x[3].slice(0, 20)).replace(/\s+/g, ' '))
  const jours = new Set([...t.matchAll(/(\d{1,2})\s?jours?\s?(?:offerts?|d['’]essai|gratuits?)/gi)].map(x => x[0]))
  const mois = new Set([...t.matchAll(/(1|un)\s?mois\s?(?:offert|gratuit)/gi)].map(x => x[0]))
  console.log('\n## ' + p + ' | essai: ' + [...jours, ...mois].join(' ; '))
  console.log([...m].filter(s => /mois|abonn|forfait|Taf|Pro|Business|Essentiel|Starter|Boutique/i.test(s)).slice(0, 14).join('\n'))
}
