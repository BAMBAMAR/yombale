// AUD-160 : relevé de la durée d'essai et du prix Sama Xaalis rendus par /sama-xaalis, et contrôle de l'absence de « Pay Safe » / « Impartial ».
// Usage : node sama-suit-reglage.mjs (pile locale :3001 et :4100). Lecture seule.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36'
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#x27;/g, ' ').replace(/\s+/g, ' ')
const get = async (p) => (await fetch('http://localhost:3001' + p, { headers: { 'user-agent': UA } })).text()
const html = await get('/sama-xaalis')
const t = strip(html)
const jours = [...new Set([...t.matchAll(/\d{1,3} (?:jours?|j) (?:offerts?|complets|d['’]essai)/gi)].map((m) => m[0]))]
const prix = [...new Set([...t.matchAll(/\d[\d  .]{0,6}\d? ?F(?:CFA)?(?:\/mois| \/ mois|\b)/g)].map((m) => m[0].trim()))].slice(0, 8)
const meta = /name="twitter:description" content="([^"]*)"/.exec(html)?.[1]
const ld = [...html.matchAll(/"price":"(\d+)"/g)].map((m) => m[1])
console.log(JSON.stringify({ jours, prix, twitterDescription: meta, jsonLdPrix: ld }, null, 1))
for (const p of ['/', '/assistant-whatsapp', '/payer-loyer']) {
  const x = strip(await get(p))
  console.log(p, 'Pay Safe:', /Pay Safe|séquestre/i.test(x), '| Impartial:', /Impartial/.test(x))
}
