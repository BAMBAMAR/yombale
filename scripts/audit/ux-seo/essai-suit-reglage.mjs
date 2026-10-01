// AUD-160 : relevé des mentions de durée d'essai rendues par les pages publiques et par /api/plans/public.
// Usage : node essai-suit-reglage.mjs  (pile locale :3001 et :4100). Lecture seule.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36'
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#x27;/g, ' ').replace(/\s+/g, ' ')
const PAGES = ['/', '/marchands', '/promo', '/tarifs-boutique', '/partenaires', '/pourquoi-nopalou']
const RE = /(?:\d{1,3}|1m|1er mois|premier mois)\s?(?:jours?|j|mois)?\s?(?:100\s?%\s?)?(?:offerts?|gratuits?|d['’]essai)/gi
const out = {}
for (const p of PAGES) {
  const r = await fetch('http://localhost:3001' + p, { headers: { 'user-agent': UA } })
  const t = strip(await r.text())
  out[p] = [...new Set([...t.matchAll(RE)].map((m) => m[0].toLowerCase()))].filter((s) => !/-25|3 mois/.test(s))
}
const plans = await (await fetch('http://localhost:4100/api/plans/public')).json()
out['/api/plans/public'] = [...new Set((plans.plans || []).flatMap((p) => p.avantages || []).filter((a) => /offert/i.test(a)))]
console.log(JSON.stringify(out, null, 1))
