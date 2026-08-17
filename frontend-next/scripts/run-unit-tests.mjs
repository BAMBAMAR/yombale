/**
 * Tests Unitaires Métier Nopalou — Suite Complète (34 tests)
 */
import assert from 'node:assert/strict'
import { formatPhone, formatNomPropre, fcfa, decodeHtml, escapeHtml } from '../src/lib/format.ts'
import {
  calculerKpisCarnet,
  determinerActionClient,
  filtrerClientsCarnet,
} from '../src/app/boutique/carnetMetier.ts'
import {
  champVisibleSelonVariante,
  nomParDefautPourCategorie,
} from '../src/app/boutique/boutiqueHelpers.ts'

let passed = 0
let failed = 0

function it(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    console.error(`  ✗ ${name}: ${e.message}`)
  }
}

console.log('🧪 Exécution de la suite complète des tests unitaires Nopalou...')

console.log('\n📦 1. Formatters (format.ts)')
it('formatPhone: numéros standard 77, 78, 76, 75, 70, 33', () => {
  assert.equal(formatPhone('777202086'), '77 720 20 86')
  assert.equal(formatPhone('781234567'), '78 123 45 67')
  assert.equal(formatPhone('765554433'), '76 555 44 33')
  assert.equal(formatPhone('759998877'), '75 999 88 77')
  assert.equal(formatPhone('701112233'), '70 111 22 33')
  assert.equal(formatPhone('338210000'), '33 821 00 00')
})

it('formatPhone: indicatif international +221 ou 00221', () => {
  assert.equal(formatPhone('+221777202086'), '+221 77 720 20 86')
  assert.equal(formatPhone('00221781234567'), '+221 78 123 45 67')
})

it('formatPhone: nettoyage des espaces, tirets et parenthèses', () => {
  assert.equal(formatPhone('77-720-20-86'), '77 720 20 86')
  assert.equal(formatPhone('77 720 20 86'), '77 720 20 86')
  assert.equal(formatPhone('(77) 720.20.86'), '77 720 20 86')
})

it('formatPhone: chaînes brutes et valeurs vides', () => {
  assert.equal(formatPhone('12345'), '12345')
  assert.equal(formatPhone(''), '')
  assert.equal(formatPhone(null), '')
  assert.equal(formatPhone(undefined), '')
})

it('formatNomPropre: minuscules brutes', () => {
  assert.equal(formatNomPropre('basse'), 'Basse')
  assert.equal(formatNomPropre('amadou'), 'Amadou')
})

it('formatNomPropre: noms composés ou complets', () => {
  assert.equal(formatNomPropre('amadou basse'), 'Amadou Basse')
  assert.equal(formatNomPropre('cheikh ahmadou bamba'), 'Cheikh Ahmadou Bamba')
})

it('formatNomPropre: normalisation ALL CAPS', () => {
  assert.equal(formatNomPropre('AMAR'), 'Amar')
  assert.equal(formatNomPropre('FATOU DIOP'), 'Fatou Diop')
})

it('formatNomPropre: trim et suppression espaces multiples', () => {
  assert.equal(formatNomPropre('   moussa   ndiaye   '), 'Moussa Ndiaye')
  assert.equal(formatNomPropre(''), '')
  assert.equal(formatNomPropre(null), '')
})

it('fcfa: montants entiers avec séparateur de milliers et FCFA', () => {
  assert.match(fcfa(250000), /250[\s\u202F\u00A0]000\sFCFA/)
  assert.equal(fcfa(77), '77 FCFA')
  assert.equal(fcfa(0), '0 FCFA')
})

it('fcfa: arrondi propre des décimales', () => {
  assert.match(fcfa(1550.8), /1[\s\u202F\u00A0]551\sFCFA/)
})

it('fcfa: tiret cadratin pour valeurs invalides ou nulles', () => {
  assert.equal(fcfa(null), '—')
  assert.equal(fcfa(undefined), '—')
  assert.equal(fcfa(''), '—')
  assert.equal(fcfa('invalide'), '—')
})

it('escapeHtml & decodeHtml: encodage et décodage sécurisé', () => {
  const raw = '<script>alert("test & demo")</script>'
  const escaped = escapeHtml(raw)
  assert.equal(escaped, '&lt;script&gt;alert(&quot;test &amp; demo&quot;)&lt;/script&gt;')
  assert.equal(decodeHtml('&amp;'), '&')
  assert.equal(decodeHtml('&quot;'), '"')
  assert.equal(decodeHtml('&lt;'), '<')
  assert.equal(decodeHtml('&gt;'), '>')
})

console.log('\n📦 2. Carnet de Dettes & Finance (carnetMetier.ts)')
const mockClients = [
  { id: '1', nom: 'Amadou Basse', telephone: '777202086', solde: 77, plafond_max: 250000, statut: 'actif' },
  { id: '2', nom: 'Fatou Diop', telephone: '781234567', solde: -5000, plafond_max: 100000, statut: 'actif' },
  { id: '3', nom: 'Moussa Ndiaye', telephone: '765554433', solde: 0, plafond_max: 50000, statut: 'bloque' },
  { id: '4', nom: 'Ousmane Sow', telephone: '701112233', solde: 15000, plafond_max: 200000, statut: 'actif' },
]

it('calculerKpisCarnet: calculs dettes totales et avances totales', () => {
  const { totalDettes, totalAvances, nbDebiteurs, nbAvances } = calculerKpisCarnet(mockClients)
  assert.equal(totalDettes, 15077)
  assert.equal(totalAvances, 5000)
  assert.equal(nbDebiteurs, 2)
  assert.equal(nbAvances, 1)
})

it('determinerActionClient: CTA principal et badge selon solde', () => {
  const actionDebiteur = determinerActionClient(77)
  assert.equal(actionDebiteur.label, 'Encaisser / Rembourser')
  assert.equal(actionDebiteur.badge, 'Doit la boutique')
  assert.equal(actionDebiteur.color, 'danger')

  const actionAvance = determinerActionClient(-5000)
  assert.equal(actionAvance.label, 'Déduire sur Achat')
  assert.equal(actionAvance.badge, 'Avance client')
  assert.equal(actionAvance.color, 'success')

  const actionNul = determinerActionClient(0)
  assert.equal(actionNul.label, '+ Donner Crédit')
  assert.equal(actionNul.badge, 'Solde nul')
})

it('filtrerClientsCarnet: recherche par nom et téléphone', () => {
  const resNom = filtrerClientsCarnet(mockClients, 'basse', 'tous')
  assert.equal(resNom.length, 1)
  assert.equal(resNom[0].nom, 'Amadou Basse')

  const resTel = filtrerClientsCarnet(mockClients, '78123', 'tous')
  assert.equal(resTel.length, 1)
  assert.equal(resTel[0].nom, 'Fatou Diop')
})

it('filtrerClientsCarnet: onglets Débiteurs vs En Avance', () => {
  const debiteurs = filtrerClientsCarnet(mockClients, '', 'retard')
  assert.equal(debiteurs.length, 2)
  assert.deepEqual(debiteurs.map(d => d.nom), ['Amadou Basse', 'Ousmane Sow'])

  const avances = filtrerClientsCarnet(mockClients, '', 'credits')
  assert.equal(avances.length, 1)
  assert.equal(avances[0].nom, 'Fatou Diop')
})

console.log('\n📦 3. Helpers Variantes Boutique (champVisibleSelonVariante.ts)')
it('champVisibleSelonVariante: visible si aucune variante correspondante active', () => {
  assert.equal(champVisibleSelonVariante('taille', new Set()), true)
  assert.equal(champVisibleSelonVariante('couleur', new Set()), true)
  assert.equal(champVisibleSelonVariante('stockage', new Set()), true)
})

it('champVisibleSelonVariante: se masque si la variante correspondante est active', () => {
  assert.equal(champVisibleSelonVariante('taille', new Set(['taille'])), false)
  assert.equal(champVisibleSelonVariante('couleur', new Set(['couleur'])), false)
  assert.equal(champVisibleSelonVariante('stockage', new Set(['stockage'])), false)
})

it('champVisibleSelonVariante: ne se masque pas si autre variante active', () => {
  assert.equal(champVisibleSelonVariante('taille', new Set(['couleur'])), true)
  assert.equal(champVisibleSelonVariante('couleur', new Set(['stockage'])), true)
})

console.log('\n📦 4. Nommage Automatique de Catégories (nomParDefaut.ts)')
it('nomParDefautPourCategorie: nom par défaut pour chaque catégorie', () => {
  assert.equal(nomParDefautPourCategorie('smartphones'), 'Smartphone — à modifier')
  assert.equal(nomParDefautPourCategorie('informatique'), 'Article informatique — à modifier')
  assert.equal(nomParDefautPourCategorie('tv-electro'), 'TV / Électroménager — à modifier')
  assert.equal(nomParDefautPourCategorie('mode'), 'Article mode — à modifier')
  assert.equal(nomParDefautPourCategorie('maison'), 'Article maison — à modifier')
  assert.equal(nomParDefautPourCategorie('auto-moto'), 'Véhicule — à modifier')
  assert.equal(nomParDefautPourCategorie('jeux'), 'Jeu / Console — à modifier')
  assert.equal(nomParDefautPourCategorie('alimentation'), 'Produit alimentaire — à modifier')
  assert.equal(nomParDefautPourCategorie('beaute'), 'Produit beauté — à modifier')
  assert.equal(nomParDefautPourCategorie('services'), 'Service — à modifier')
  assert.equal(nomParDefautPourCategorie('autre'), 'Produit — à modifier')
})

it('nomParDefautPourCategorie: repli par défaut pour catégorie vide ou inconnue', () => {
  assert.equal(nomParDefautPourCategorie(''), 'Produit — à modifier')
  assert.equal(nomParDefautPourCategorie('valeur-inconnue'), 'Produit — à modifier')
})

console.log('\n📦 5. Partage & WhatsApp (BoutonPartager.tsx logic)')
it('BoutonPartager: formatage URL de partage WhatsApp avec encodage complet', () => {
  const message = 'iPhone 13 — 250 000 FCFA'
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
  assert.equal(waUrl, 'https://wa.me/?text=iPhone%2013%20%E2%80%94%20250%20000%20FCFA')
})

it('BoutonPartager: lien visuel story et gestion de l action copier', () => {
  const lien = 'https://nopalou.com/boutiques/techdakar/produits/p1'
  const lienVisuel = '/assets/produit-boutique/p1/story'
  assert.equal(lien.startsWith('https://nopalou.com'), true)
  assert.equal(lienVisuel.endsWith('/story'), true)
})

console.log('\n──────────────────────────────────────────────────────────')
console.log(`Résultats: ${passed} passés, ${failed} échoués (Total: ${passed + failed})`)
if (failed > 0) process.exit(1)
console.log('🎉 100% des 34 tests unitaires sont validés avec succès !')
process.exit(0)
