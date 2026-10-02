// Recoupement obligatoire (CLAUDE.md §3) : rejoue les correctifs vocaux annonces par la livraison e74e666c (29/09/2026) sur le code actuel.
// Usage : node --experimental-strip-types scripts/audit/voice/08-recoupement-livraisons.mjs
import { parseDetteIntent, parseSaisieExpressIntent, parseAjoutProduitIntent, extraireMontantCFA } from '../../../frontend-next/src/lib/voice-assistant.ts'
const t = []
const ok = (nom, cond, detail) => t.push({ nom, tenu: !!cond, detail })
let r = parseDetteIntent('Paiement dette Amadou 15000', ['Amadou Ba'])
ok('P0 inversion dette/remboursement : "Paiement dette Amadou 15000" -> remboursement', r.type === 'remboursement', JSON.stringify(r))
r = parseDetteIntent('Moussa a payé 5000', ['Moussa Diop'])
ok('"Moussa a payé 5000" -> remboursement', r.type === 'remboursement', JSON.stringify(r))
r = parseDetteIntent('Moussa Diop 77 123 45 67 dette 10000', [])
ok('numero dicte non pris pour un montant', r.montant === 10000, JSON.stringify(r))
r = parseDetteIntent('Bonjour', [])
ok('salutation sans faux client', !r.nomClient, JSON.stringify(r))
r = parseAjoutProduitIntent('Sac à main en cuir ñaari junni')
ok('Wolof purge du nom produit', r.nom === 'Sac à main en cuir' && r.prix === 10000, JSON.stringify(r))
r = parseSaisieExpressIntent('sacs plastiques 2000', 'depense')
ok('fournitures avant stock', r.categorie === 'fournitures', JSON.stringify(r))
r = parseSaisieExpressIntent('remboursement 5000', 'vente')
ok('remboursement/dette detectes comme charge', r.mode === 'depense', JSON.stringify(r))
r = parseSaisieExpressIntent('dépense ñaari junni loyer', 'depense')
ok('Saisie express : aucun mot wolof residuel dans le libelle', !/naari/i.test(r.description || ''), JSON.stringify(r))
r = extraireMontantCFA('trois mille cinq cents')
ok('montant en lettres composes ("trois mille cinq cents" = 3500)', r === 3500, String(r))
for (const x of t) console.log((x.tenu ? 'TENU        ' : 'NON TENU    ') + x.nom + '  ->  ' + x.detail)
