// Amorce un marchand de test (boutique + 3 produits + 2 clients du carnet) sur la pile isolee. Idempotent. Sortie JSON sur stdout.
import { garde, seedUser, api } from './lib.mjs'
garde()
const u = await seedUser('voiceb')
let b = await api('GET', '/api/boutiques/mine', null, u.token)
let boutique = (Array.isArray(b.d) ? b.d : b.d.boutiques || [])[0]
if (!boutique) {
  const r = await api('POST', '/api/boutiques', { nom: 'Boutique Voix Audit', telephone: '771110077', ville: 'Dakar', categorie: 'alimentation' }, u.token)
  boutique = r.d.boutique || r.d
  if (!boutique.id) throw new Error('boutique: ' + JSON.stringify(r.d).slice(0, 300))
}
const prods = []
for (const [nom, prix, stock] of [['Café Touba', 500, 200], ['Riz parfumé 5kg', 15000, 50], ['Sucre 1kg', 750, 100]]) {
  const r = await api('POST', `/api/boutiques/${boutique.id}/produits`, { nom, prix, stock_quantite: stock, categorie: 'alimentation' }, u.token)
  prods.push({ nom, s: r.s, err: r.s >= 300 ? r.d : undefined })
}
const clients = []
for (const [nom, tel] of [['Moussa Diop', '771230001'], ['Fatou Sall', '771230002']]) {
  const r = await api('POST', `/api/boutiques/${boutique.id}/credits-clients`, { nom, telephone: tel }, u.token)
  clients.push({ nom, s: r.s, err: r.s >= 300 ? r.d : undefined })
}
console.log(JSON.stringify({ email: u.email, uid: u.uid, boutiqueId: boutique.id, prods, clients }, null, 1))
