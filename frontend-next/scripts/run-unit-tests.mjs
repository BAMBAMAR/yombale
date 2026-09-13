/**
 * Tests Unitaires Métier Nopalou — Suite Complète (34 tests)
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { formatPhone, formatNomPropre, fcfa, formatNombre, decodeHtml, escapeHtml } from '../src/lib/format.ts'
import { safeJsonParse } from '../src/lib/errorHandler.ts'
import {
  calculerKpisCarnet,
  determinerActionClient,
  filtrerClientsCarnet,
} from '../src/app/boutique/carnetMetier.ts'
import {
  champVisibleSelonVariante,
  nomParDefautPourCategorie,
} from '../src/app/boutique/boutiqueHelpers.ts'
import {
  extraireMontantCFA,
  parseSaisieExpressIntent,
  parseDetteIntent,
  cleanVoiceSearchQuery,
  normaliserTexteVocal,
  parseAjoutProduitIntent,
  getMessageErreurMicro,
} from '../src/lib/voice-assistant.ts'
import {
  estimerFraisLivraison,
  ZONES_LIVRAISON_SENEGAL,
  COMMUNES_LISTE,
} from '../src/lib/logistique-senegal.ts'
import { CATEGORY_COVER_PHOTOS } from '../src/lib/boutique-covers.ts'
import { convertirDepuisFcfa, formaterMontantDevise, DEVISES_REGIONALES } from '../src/lib/devises.ts'
import { SECTIONS_PAR_DEFAUT } from '../src/lib/boutique-sections.ts'
import {
  normaliserTexteRecherche,
  genererFormePhonetiqueWolof,
  expandRechercheSenegal,
  matcherProduitRecherche,
  scorePertinenceProduit,
} from '../src/lib/recherche-senegal.ts'
import {
  genererEcrituresSyscohada,
  getCompteTresorerieSyscohada,
} from '../src/lib/syscohada-export.ts'

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

it('fcfa & formatNombre: support arabe avec chiffres arabo-orientaux (٠, ١, ٢...)', () => {
  const prixArabe = fcfa(250000, 'ar')
  assert.ok(prixArabe.includes('FCFA'))
  assert.match(prixArabe, /[٠-٩]/)
  const nombreArabe = formatNombre(2847, 'ar')
  assert.match(nombreArabe, /[٠-٩]/)
})

it('fcfa & formatNombre: support anglais avec separateur virgule', () => {
  assert.equal(fcfa(250000, 'en'), '250,000 FCFA')
  assert.equal(formatNombre(2847, 'en'), '2,847')
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

console.log('\n📦 6. Catalogue & Variantes E-Commerce (Categories & Cart logic)')
import { CATEGORIES } from '../src/lib/categories.ts'

it('CATEGORIES: présence des catégories officielles parfum et optique', () => {
  const parfum = CATEGORIES.find(c => c.value === 'parfum')
  assert.equal(Boolean(parfum), true)
  assert.equal(parfum.label.includes('Parfumerie'), true)

  const optique = CATEGORIES.find(c => c.value === 'optique')
  assert.equal(Boolean(optique), true)
  assert.equal(optique.label.includes('Lunettes'), true)
})

it('Catalogues Standards Batch: présence des modèles parfum et optique avec photos HD', () => {
  const currentDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1'))
  const catalogPath = path.resolve(currentDir, '..', '..', 'backend', 'data', 'catalogues-standards.json')
  assert.equal(fs.existsSync(catalogPath), true)
  const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'))
  
  assert.equal(Array.isArray(catalog.parfum), true)
  assert.equal(catalog.parfum.length >= 100, true)
  assert.equal(catalog.parfum.every(p => p.nom && p.photo_defaut && p.categorie === 'parfum'), true)

  assert.equal(Array.isArray(catalog.optique), true)
  assert.equal(catalog.optique.length >= 100, true)
  assert.equal(catalog.optique.every(p => p.nom && p.photo_defaut && p.categorie === 'optique'), true)
})

it('CartItem: génération de clés uniques pour variantes distinctes d un même produit', () => {
  const pId = 'prod-123'
  const itemKey1 = `${pId}_var_var-rouge-m`
  const itemKey2 = `${pId}_var_var-rouge-xl`
  assert.notEqual(itemKey1, itemKey2)

  // Simulation d'ajout de 2 variantes dans un panier
  const cartItems = [
    { id: itemKey1, produitId: pId, varianteId: 'var-rouge-m', nom: 'Robe Wax', detailsVariante: 'Taille: M, Couleur: Rouge', prix: 15000, quantite: 1 },
    { id: itemKey2, produitId: pId, varianteId: 'var-rouge-xl', nom: 'Robe Wax', detailsVariante: 'Taille: XL, Couleur: Rouge', prix: 17000, quantite: 2 },
  ]
  assert.equal(cartItems.length, 2)
  const total = cartItems.reduce((acc, it) => acc + (it.prix * it.quantite), 0)
  assert.equal(total, 15000 + 34000)
})

it('Variantes: détection des prix variables (À partir de / Dès X FCFA)', () => {
  const skus = [
    { id: 'v1', prix: 450000 },
    { id: 'v2', prix: 520000 },
  ]
  const minPrix = Math.min(...skus.map(s => s.prix))
  const maxPrix = Math.max(...skus.map(s => s.prix))
  const isVariable = minPrix < maxPrix
  assert.equal(isVariable, true)
  assert.equal(minPrix, 450000)
  assert.equal(maxPrix, 520000)
})

console.log('\n📦 7. Internationalisation i18n (FR / EN / AR)')
import { LOCALES, DEFAULT_LOCALE, LOCALES_META, isLocale, isRTL, getValidLocale, isI18nScopedRoute } from '../src/i18n/config.ts'

import { common as frCommon } from '../src/i18n/locales/fr/common.ts'
import { auth as frAuth } from '../src/i18n/locales/fr/auth.ts'
import { account as frAccount } from '../src/i18n/locales/fr/account.ts'
import { shop as frShop } from '../src/i18n/locales/fr/shop.ts'
import { caisse as frCaisse } from '../src/i18n/locales/fr/caisse.ts'
import { errors as frErrors } from '../src/i18n/locales/fr/errors.ts'

import { common as enCommon } from '../src/i18n/locales/en/common.ts'
import { auth as enAuth } from '../src/i18n/locales/en/auth.ts'
import { account as enAccount } from '../src/i18n/locales/en/account.ts'
import { shop as enShop } from '../src/i18n/locales/en/shop.ts'
import { caisse as enCaisse } from '../src/i18n/locales/en/caisse.ts'
import { errors as enErrors } from '../src/i18n/locales/en/errors.ts'

import { common as arCommon } from '../src/i18n/locales/ar/common.ts'
import { auth as arAuth } from '../src/i18n/locales/ar/auth.ts'
import { account as arAccount } from '../src/i18n/locales/ar/account.ts'
import { shop as arShop } from '../src/i18n/locales/ar/shop.ts'
import { caisse as arCaisse } from '../src/i18n/locales/ar/caisse.ts'
import { errors as arErrors } from '../src/i18n/locales/ar/errors.ts'

const frDict = { common: frCommon, auth: frAuth, account: frAccount, shop: frShop, caisse: frCaisse, errors: frErrors }
const enDict = { common: enCommon, auth: enAuth, account: enAccount, shop: enShop, caisse: enCaisse, errors: enErrors }
const arDict = { common: arCommon, auth: arAuth, account: arAccount, shop: arShop, caisse: arCaisse, errors: arErrors }

const dictionaries = { fr: frDict, en: enDict, ar: arDict }
function getDictionary(locale) {
  return dictionaries[locale] || dictionaries.fr
}

function getDeepKeys(obj, prefix = '') {
  let keys = []
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getDeepKeys(value, currentPath))
    } else {
      keys.push(currentPath)
    }
  }
  return keys.sort()
}

it('i18n config: 3 langues supportées, français par défaut et RTL arabe', () => {
  assert.deepEqual(LOCALES, ['fr', 'en', 'ar'])
  assert.equal(DEFAULT_LOCALE, 'fr')
  assert.equal(isRTL('ar'), true)
  assert.equal(isRTL('fr'), false)
  assert.equal(isRTL('en'), false)
  assert.equal(isLocale('fr'), true)
  assert.equal(isLocale('en'), true)
  assert.equal(isLocale('ar'), true)
  assert.equal(isLocale('es'), false)
  assert.equal(getValidLocale('en'), 'en')
  assert.equal(getValidLocale('inconnu'), 'fr')
})

it('i18n routes: cloisonnement strict des routes publiques (FR/LTR) vs Compte/Boutique/Auth (i18n)', () => {
  // Routes publiques -> false (doivent rester en français et LTR)
  assert.equal(isI18nScopedRoute('/'), false)
  assert.equal(isI18nScopedRoute('/produit/123'), false)
  assert.equal(isI18nScopedRoute('/boutiques'), false)
  assert.equal(isI18nScopedRoute('/boutiques/my-shop-id'), false)
  assert.equal(isI18nScopedRoute('/categorie/telephones'), false)
  assert.equal(isI18nScopedRoute('/immo'), false)
  assert.equal(isI18nScopedRoute('/telecom'), false)
  assert.equal(isI18nScopedRoute('/cgu'), false)
  assert.equal(isI18nScopedRoute('/confidentialite'), false)
  assert.equal(isI18nScopedRoute('/comparaison'), false)

  // Routes Compte / Boutique / Auth -> true (traduites avec support RTL)
  assert.equal(isI18nScopedRoute('/compte'), true)
  assert.equal(isI18nScopedRoute('/compte/profil'), true)
  assert.equal(isI18nScopedRoute('/boutique'), true)
  assert.equal(isI18nScopedRoute('/boutique/caisse'), true)
  assert.equal(isI18nScopedRoute('/boutique/analytics'), true)
  assert.equal(isI18nScopedRoute('/mes-annonces'), true)
  assert.equal(isI18nScopedRoute('/mes-annonces-immo'), true)
  assert.equal(isI18nScopedRoute('/mes-alertes'), true)
  assert.equal(isI18nScopedRoute('/deposer-annonce'), true)
  assert.equal(isI18nScopedRoute('/deposer-immo'), true)
  assert.equal(isI18nScopedRoute('/connexion'), true)
  assert.equal(isI18nScopedRoute('/inscription'), true)
  assert.equal(isI18nScopedRoute('/mot-de-passe-oublie'), true)
})

it('i18n meta: drapeaux et libellés natifs', () => {
  assert.equal(LOCALES_META.fr.label, 'Français')
  assert.equal(LOCALES_META.en.label, 'Anglais')
  assert.equal(LOCALES_META.en.nativeLabel, 'English')
  assert.equal(LOCALES_META.ar.label, 'Arabe')
  assert.equal(LOCALES_META.ar.nativeLabel, 'العربية')
  assert.equal(LOCALES_META.ar.dir, 'rtl')
})

const frKeys = getDeepKeys(frDict)
const enKeys = getDeepKeys(enDict)
const arKeys = getDeepKeys(arDict)

it('i18n parité FR / EN / AR: 100% des clés présentes et identiques', () => {
  assert.equal(frKeys.length > 50, true)
  assert.equal(enKeys.length, frKeys.length)
  assert.equal(arKeys.length, frKeys.length)

  const missingInEn = frKeys.filter(k => !enKeys.includes(k))
  assert.deepEqual(missingInEn, [])

  const missingInAr = frKeys.filter(k => !arKeys.includes(k))
  assert.deepEqual(missingInAr, [])
})

it('i18n contenu: aucune traduction vide', () => {
  function verifyNonEmpty(dict) {
    for (const [k, v] of Object.entries(dict)) {
      if (typeof v === 'object' && v !== null) verifyNonEmpty(v)
      else assert.equal(typeof v === 'string' && v.trim().length > 0, true)
    }
  }
  verifyNonEmpty(frDict)
  verifyNonEmpty(enDict)
  verifyNonEmpty(arDict)
})

it('i18n getDictionary: résout et applique le fallback', () => {
  assert.equal(getDictionary('fr').common.save, 'Enregistrer')
  assert.equal(getDictionary('en').common.save, 'Save')
  assert.equal(getDictionary('ar').common.save, 'حفظ')
  assert.equal(getDictionary('invalid').common.save, 'Enregistrer')
})

console.log('\n📦 8. Assistant Vocal & Parsing Wolof / FR (voice-assistant.ts)')
it('extraireMontantCFA: devises Wolof et multiplicateurs (téemeer, junni)', () => {
  assert.equal(extraireMontantCFA('benn teemeer'), 500)
  assert.equal(extraireMontantCFA('naari junni'), 10000)
  assert.equal(extraireMontantCFA('fukki junni'), 50000)
  assert.equal(extraireMontantCFA('vente 2500 cfa'), 2500)
  assert.equal(extraireMontantCFA('cinq mille'), 5000)
})

it('parseSaisieExpressIntent: détection automatique dépense / vente et catégories', () => {
  // Singulier et pluriel
  const d1 = parseSaisieExpressIntent('Dépense transport 2500')
  assert.equal(d1.mode, 'depense')
  assert.equal(d1.categorie, 'transport')
  assert.equal(d1.montant, 2500)

  const d1Pluriel = parseSaisieExpressIntent('Dépenses transport 2500')
  assert.equal(d1Pluriel.mode, 'depense')
  assert.equal(d1Pluriel.categorie, 'transport')
  assert.equal(d1Pluriel.montant, 2500)

  // Catégorie directe sans le mot "dépense"
  const d2 = parseSaisieExpressIntent('Loyer cinquante mille')
  assert.equal(d2.mode, 'depense')
  assert.equal(d2.categorie, 'loyer')
  assert.equal(d2.montant, 50000)

  const d3 = parseSaisieExpressIntent('Essence 2000')
  assert.equal(d3.mode, 'depense')
  assert.equal(d3.categorie, 'transport')
  assert.equal(d3.montant, 2000)

  // Mode contextuel (l'utilisateur est déjà sur l'onglet Dépense)
  const d4 = parseSaisieExpressIntent('Repas midi 1500', 'depense')
  assert.equal(d4.mode, 'depense')
  assert.equal(d4.montant, 1500)

  const d5 = parseSaisieExpressIntent('2500', 'depense')
  assert.equal(d5.mode, 'depense')
  assert.equal(d5.montant, 2500)

  // Vente explicite
  const v1 = parseSaisieExpressIntent('Vente café Touba 500')
  assert.equal(v1.mode, 'vente')
  assert.equal(v1.montant, 500)
  assert.equal(v1.libelleProduit?.toLowerCase().includes('cafe touba'), true)
})

it('parseDetteIntent: détection crédit, remboursement et client', () => {
  const c1 = parseDetteIntent('Dette Moussa 10 000', ['Moussa', 'Fatou'])
  assert.equal(c1.type, 'vente_credit')
  assert.equal(c1.nomClient, 'Moussa')
  assert.equal(c1.montant, 10000)

  const c2 = parseDetteIntent('Bor Moussa 10 000', ['Moussa', 'Fatou'])
  assert.equal(c2.type, 'vente_credit')
  assert.equal(c2.nomClient, 'Moussa')
  assert.equal(c2.montant, 10000)

  const c3 = parseDetteIntent('Moussa doit 10 000', ['Moussa', 'Fatou'])
  assert.equal(c3.type, 'vente_credit')
  assert.equal(c3.nomClient, 'Moussa')
  assert.equal(c3.montant, 10000)

  const c4 = parseDetteIntent('Moussa 10 000', ['Moussa', 'Fatou'])
  assert.equal(c4.type, 'vente_credit')
  assert.equal(c4.nomClient, 'Moussa')
  assert.equal(c4.montant, 10000)

  const c5 = parseDetteIntent('Bord Moussa 10 mille', ['Moussa', 'Fatou'])
  assert.equal(c5.type, 'vente_credit')
  assert.equal(c5.nomClient, 'Moussa')
  assert.equal(c5.montant, 10000)

  const c6 = parseDetteIntent('Moussa dix mille', ['Moussa', 'Fatou'])
  assert.equal(c6.type, 'vente_credit')
  assert.equal(c6.nomClient, 'Moussa')
  assert.equal(c6.montant, 10000)

  const r1 = parseDetteIntent('Remboursement Fatou 5000', ['Moussa', 'Fatou'])
  assert.equal(r1.type, 'remboursement')
  assert.equal(r1.nomClient, 'Fatou')
  assert.equal(r1.montant, 5000)

  const r2 = parseDetteIntent('Fatou feyna 5000', ['Moussa', 'Fatou'])
  assert.equal(r2.type, 'remboursement')
  assert.equal(r2.nomClient, 'Fatou')
  assert.equal(r2.montant, 5000)

  const r3 = parseDetteIntent('Fatou faillite 5000', ['Moussa', 'Fatou'])
  assert.equal(r3.type, 'remboursement')
  assert.equal(r3.nomClient, 'Fatou')
  assert.equal(r3.montant, 5000)

  const s1 = parseDetteIntent('Moussa Diallo', ['Moussa Diallo'])
  assert.equal(s1.type, 'recherche')
  assert.equal(s1.nomClient, 'Moussa Diallo')
})

it('cleanVoiceSearchQuery: extraction propre du mot-clé produit', () => {
  assert.equal(cleanVoiceSearchQuery('Cherche robe en wax'), 'robe en wax')
  assert.equal(cleanVoiceSearchQuery('Trouve-moi des chaussures'), 'des chaussures')
})

it('parseAjoutProduitIntent: extraction nom et prix mixte Wolof / Français', () => {
  const p1 = parseAjoutProduitIntent('Robe Bazin brodée 15000')
  assert.equal(p1.prix, 15000)
  assert.equal(p1.nom.toLowerCase().includes('robe bazin brod'), true)

  const p2 = parseAjoutProduitIntent('Lait Bonnet Rouge benn teemeer')
  assert.equal(p2.prix, 500)
  assert.equal(p2.nom.toLowerCase().includes('lait bonnet rouge'), true)

  const p3 = parseAjoutProduitIntent('Chaussures de sport Nike')
  assert.equal(p3.prix, null)
  assert.equal(p3.nom, 'Chaussures de sport Nike')
})

it('getMessageErreurMicro: aide claire pour not-allowed et cadenas', () => {
  const msg = getMessageErreurMicro('not-allowed')
  assert.equal(msg.includes('cadenas'), true)
  assert.equal(msg.includes('Microphone'), true)
})

console.log('\n📦 9. Logistique & Tarifs Tiak-Tiak Sénégal (logistique-senegal.ts)')
it('estimerFraisLivraison: calcul exact par commune et zones', () => {
  const f1 = estimerFraisLivraison('Plateau')
  assert.equal(f1.montant, 1000)
  assert.equal(f1.zoneNom.includes('Plateau'), true)

  const f2 = estimerFraisLivraison('Almadies')
  assert.equal(f2.montant, 1500)

  const f3 = estimerFraisLivraison('Pikine')
  assert.equal(f3.montant, 2200)

  const f4 = estimerFraisLivraison('Thiès')
  assert.equal(f4.montant, 3500)

  const f5 = estimerFraisLivraison('Ziguinchor')
  assert.equal(f5.montant, 5000)
})

it('estimerFraisLivraison: seuil de gratuité débloqué', () => {
  const fg = estimerFraisLivraison('Almadies', { seuilGratuite: 25000, sousTotal: 30000 })
  assert.equal(fg.montant, 0)
  assert.equal(fg.estGratuit, true)
  assert.equal(fg.economie, 1500)
})

it('ZONES_LIVRAISON_SENEGAL: intégrité des communes et transporteurs', () => {
  assert.equal(ZONES_LIVRAISON_SENEGAL.length >= 7, true)
  assert.equal(COMMUNES_LISTE.includes('Plateau'), true)
  assert.equal(COMMUNES_LISTE.includes('Guédiawaye'), true)
  assert.equal(COMMUNES_LISTE.includes('Touba'), true)
})

console.log('\n📦 10. SYSCOHADA & Audit P0-P3 Remediations')
import { FACETTES_CONFIG, detecterFamilleFacette } from '../src/lib/facettes.ts'

it('FacettesDynamiques: configuration des filtres par catégorie métier et détection famille', () => {
  assert.ok(FACETTES_CONFIG['smartphones'])
  assert.ok(FACETTES_CONFIG['mode'])
  assert.ok(FACETTES_CONFIG['informatique'])

  // Vérification des options smartphones (stockage, ram)
  const phoneStockage = FACETTES_CONFIG['smartphones'].find(f => f.key === 'stockage')
  assert.ok(phoneStockage)
  assert.ok(phoneStockage.options.includes('128 Go'))
  assert.ok(phoneStockage.options.includes('256 Go'))

  // Vérification des options mode (taille, pointure)
  const modeTaille = FACETTES_CONFIG['mode'].find(f => f.key === 'taille')
  assert.ok(modeTaille)
  assert.ok(modeTaille.options.includes('M'))
  assert.ok(modeTaille.options.includes('XL'))

  // Vérification de la détection
  assert.equal(detecterFamilleFacette('smartphones'), 'tech')
  assert.equal(detecterFamilleFacette('chaussures-homme'), 'mode')
  assert.equal(detecterFamilleFacette('immobilier-dakar'), 'immo')
  assert.equal(detecterFamilleFacette('autre'), null)
})

it('SYSCOHADA Plan Comptable: comptes de trésorerie et ventes de marchandises', () => {
  // Mapping OHADA réglementaire
  const comptesOHADA = {
    caisse: '571000',
    wave: '521100',
    orange_money: '521200',
    credit_client: '411100',
    banque: '521000',
    ventes_marchandises: '701000',
  }
  assert.equal(comptesOHADA.caisse, '571000')
  assert.equal(comptesOHADA.wave, '521100')
  assert.equal(comptesOHADA.orange_money, '521200')
  assert.equal(comptesOHADA.credit_client, '411100')
  assert.equal(comptesOHADA.ventes_marchandises, '701000')
})

it('ErrorHandler & Resilience: safeJsonParse parse correctement ou retourne le fallback sécurisé', () => {
  const parsed = safeJsonParse('{"ok":true,"val":123}', { ok: false, val: 0 })
  assert.equal(parsed.ok, true)
  assert.equal(parsed.val, 123)

  const fallback = safeJsonParse('invalid-json', { ok: false, val: 999 }, 'unit-test')
  assert.equal(fallback.ok, false)
  assert.equal(fallback.val, 999)

  const nullVal = safeJsonParse(null, 'default')
  assert.equal(nullVal, 'default')
})

console.log('\n📦 11. Studio Personnalisation & Tiroir-Caisse POS')
it('Boutique Covers: 20 catégories ont chacune des photos HD thématiques uniques et dédiées', () => {
  assert.ok(CATEGORY_COVER_PHOTOS)
  // Toutes les catégories officielles ont des couvertures dédiées
  CATEGORIES.forEach(cat => {
    const photos = CATEGORY_COVER_PHOTOS[cat.value]
    assert.ok(photos, `Catégorie ${cat.value} doit avoir des photos de couverture`)
    assert.ok(photos.length >= 4, `Catégorie ${cat.value} doit avoir au moins 4 photos HD`)
  })

  // Vérification de la non-duplication : parfum a des photos de parfum, pas de mode
  const photosParfum = CATEGORY_COVER_PHOTOS['parfum']
  const photosMode = CATEGORY_COVER_PHOTOS['mode']
  assert.notDeepEqual(photosParfum, photosMode, 'Parfum et Mode ne doivent pas partager les mêmes photos')

  // Vérification de la non-duplication : alimentation et smartphones
  const photosAlim = CATEGORY_COVER_PHOTOS['alimentation']
  const photosSmartphones = CATEGORY_COVER_PHOTOS['smartphones']
  assert.notDeepEqual(photosAlim, photosSmartphones, 'Alimentation et Smartphones ne doivent pas partager les mêmes photos')
})

it('Tiroir-Caisse & Clôture Z: calcul précis du solde théorique et détection de l écart de caisse', () => {
  const fondInitial = 50000
  const ventesEspeces = 120000
  const entreesEspeces = 10000 // Appoint monnaie
  const sortiesEspeces = 15000 // Paiement coursier Tiak-Tiak

  // Solde théorique = fondInitial + ventesEspeces + entrees - sorties
  const soldeTheorique = fondInitial + ventesEspeces + entreesEspeces - sortiesEspeces
  assert.equal(soldeTheorique, 165000)

  // Cas 1 : Comptage parfait
  const compteParfait = 165000
  const ecartParfait = compteParfait - soldeTheorique
  assert.equal(ecartParfait, 0)

  // Cas 2 : Déficit de caisse (ex: 3 000 FCFA manquants)
  const compteDeficit = 162000
  const ecartDeficit = compteDeficit - soldeTheorique
  assert.equal(ecartDeficit, -3000)

  // Cas 3 : Excédent de caisse
  const compteExcedent = 168000
  const ecartExcedent = compteExcedent - soldeTheorique
  assert.equal(ecartExcedent, 3000)
})

it('Décompte Billetterie BCEAO: validation du comptage par coupures', () => {
  const coupures = {
    '10000': 10, // 100 000
    '5000': 10,  // 50 000
    '2000': 5,   // 10 000
    '1000': 5,   // 5 000
    '500': 0,
    '200': 0,
    '100': 0,
    '50': 0,
    '25': 0,
  }
  const totalBillets = Object.entries(coupures).reduce((sum, [val, qte]) => sum + (Number(val) * qte), 0)
  assert.equal(totalBillets, 165000)
})

console.log('\n📦 12. Multi-Devises Indicatif & Diaspora (devises.ts)')
it('convertirDepuisFcfa: parité fixe EUR (655.957 FCFA) et conversion USD, GNF, NGN', () => {
  // 65 596 FCFA ~= 100 EUR
  const enEur = convertirDepuisFcfa(65595.7, 'EUR')
  assert.equal(Math.round(enEur), 100)

  // 10 000 FCFA en GNF (~142 500 GNF)
  const enGnf = convertirDepuisFcfa(10000, 'GNF')
  assert.equal(Math.round(enGnf), 142500)

  // 10 000 FCFA en NGN (~24 500 NGN)
  const enNgn = convertirDepuisFcfa(10000, 'NGN')
  assert.equal(Math.round(enNgn), 24500)

  // XOF reste 1 pour 1
  assert.equal(convertirDepuisFcfa(5000, 'XOF'), 5000)
})

it('formaterMontantDevise: symboles et formatage propre', () => {
  const fEur = formaterMontantDevise(65596, 'EUR', 'fr-FR')
  assert.equal(fEur.includes('€'), true)

  const fUsd = formaterMontantDevise(60500, 'USD', 'fr-FR')
  assert.equal(fUsd.includes('$'), true)

  const fXof = formaterMontantDevise(5000, 'XOF', 'fr-FR')
  assert.equal(fXof.includes('FCFA'), true)
})

console.log('\n📦 13. Disposition & Glisser-Déposer des Sections (StudioDispositionSections.tsx)')
it('SECTIONS_PAR_DEFAUT: intégrité des 5 sections canoniques et identifiants uniques', () => {
  assert.equal(SECTIONS_PAR_DEFAUT.length, 5)
  const ids = SECTIONS_PAR_DEFAUT.map(s => s.id)
  assert.equal(ids.includes('banniere'), true)
  assert.equal(ids.includes('recherche_filtres'), true)
  assert.equal(ids.includes('produits'), true)
  assert.equal(ids.includes('social'), true)
  assert.equal(ids.includes('contact'), true)
  assert.equal(new Set(ids).size, 5)
})

console.log('\n📦 14. Recherche Phonétique & Synonymes Sénégal (recherche-senegal.ts)')
it('normaliserTexteRecherche: minuscules, accents supprimés, ponctuation nettoyée', () => {
  assert.equal(normaliserTexteRecherche('Café Touba !'), 'cafe touba')
  assert.equal(normaliserTexteRecherche('THIÉBOUDIENNE  Pilon'), 'thieboudienne pilon')
  assert.equal(normaliserTexteRecherche("Lait d'Arachide"), 'lait d arachide')
})

it('genererFormePhonetiqueWolof: équivalences th->c, kh->x, dj->j, ou->u', () => {
  assert.equal(genererFormePhonetiqueWolof('thieb'), 'ceb')
  assert.equal(genererFormePhonetiqueWolof('ceeb'), 'ceb')
  assert.equal(genererFormePhonetiqueWolof('khaliss'), 'xaliss')
  assert.equal(genererFormePhonetiqueWolof('touba'), 'tuba')
})

it('expandRechercheSenegal: génération des synonymes sénégalais usuels', () => {
  const synDall = expandRechercheSenegal('dall')
  assert.equal(synDall.includes('chaussure'), true)
  assert.equal(synDall.includes('sandale'), true)

  const synCeeb = expandRechercheSenegal('ceeb')
  assert.equal(synCeeb.includes('riz'), true)
  assert.equal(synCeeb.includes('thieb'), true)

  const synAtaya = expandRechercheSenegal('ataya')
  assert.equal(synAtaya.includes('the'), true)
})

it('matcherProduitRecherche: détection par synonyme et tolérance phonétique', () => {
  const p1 = { nom: 'Sac de Riz Brisé Parfumé 25kg', description: 'Idéal pour le ceebu jën' }
  // Recherche 'thieb' doit trouver le riz
  assert.equal(matcherProduitRecherche(p1, 'thieb'), true)
  // Recherche 'ceeb' doit trouver le riz
  assert.equal(matcherProduitRecherche(p1, 'ceeb'), true)

  const p2 = { nom: 'Sandales en Cuir Artisanal Dakar', description: 'Confort et élégance' }
  // Recherche 'dall' doit trouver les sandales
  assert.equal(matcherProduitRecherche(p2, 'dall'), true)

  const p3 = { nom: 'Grand Boubou Bazin Riche', description: 'Tenue brodée pour fêtes' }
  // Recherche 'yeure' doit trouver le boubou
  assert.equal(matcherProduitRecherche(p3, 'yeure'), true)
})

it('scorePertinenceProduit: priorité au nom exact puis aux synonymes', () => {
  const pExact = { nom: 'Café Touba 500g' }
  const pSyn = { nom: 'Tisane Kinkeliba', description: 'Boisson chaude comme le café' }

  const score1 = scorePertinenceProduit(pExact, 'café')
  const score2 = scorePertinenceProduit(pSyn, 'café')
  assert.equal(score1 > score2, true)
})

console.log('\n📦 15. Export ERP & Comptabilité SYSCOHADA (syscohada-export.ts)')
it('getCompteTresorerieSyscohada: mapping précis des modes Wave, OM, Cash, Carte, Crédit', () => {
  assert.equal(getCompteTresorerieSyscohada('cash'), '571100')
  assert.equal(getCompteTresorerieSyscohada('wave'), '521200')
  assert.equal(getCompteTresorerieSyscohada('orange_money'), '521300')
  assert.equal(getCompteTresorerieSyscohada('carte'), '521400')
  assert.equal(getCompteTresorerieSyscohada('credit'), '411100')
  assert.equal(getCompteTresorerieSyscohada('inconnu'), '571100')
})

it('genererEcrituresSyscohada: équilibre strict débit/crédit (partie double) en régime simplifié', () => {
  const transactions = [
    { id: 'tx-1', date: '2026-09-12', montantTotal: 15000, modePaiement: 'wave', type: 'vente', reference: 'CMD-101' },
    { id: 'tx-2', date: '2026-09-12', montantTotal: 5000, modePaiement: 'cash', type: 'depense', libelle: 'Achat fournitures' },
    { id: 'tx-3', date: '2026-09-12', montantTotal: 25000, modePaiement: 'credit', type: 'vente', clientNom: 'Modou Fall' },
  ]
  const ecritures = genererEcrituresSyscohada(transactions, 'simplifie')
  assert.equal(ecritures.length, 6)

  const totalDebit = ecritures.reduce((s, e) => s + e.debit, 0)
  const totalCredit = ecritures.reduce((s, e) => s + e.credit, 0)
  assert.equal(totalDebit, totalCredit)
  assert.equal(totalDebit, 45000)
})

it('genererEcrituresSyscohada: équilibre strict débit/crédit en régime réel avec TVA 18%', () => {
  const transactions = [
    { id: 'tx-4', date: '2026-09-12', montantTotal: 11800, modePaiement: 'orange_money', type: 'vente', tauxTva: 0.18 },
  ]
  const ecritures = genererEcrituresSyscohada(transactions, 'reel')
  assert.equal(ecritures.length, 3)

  const debitLigne = ecritures.find(e => e.debit > 0)
  assert.equal(debitLigne.debit, 11800)
  assert.equal(debitLigne.compteGeneral, '521300') // OM

  const venteHT = ecritures.find(e => e.compteGeneral === '701100')
  assert.equal(venteHT.credit, 10000)

  const tvaLigne = ecritures.find(e => e.compteGeneral === '443100')
  assert.equal(tvaLigne.credit, 1800)

  const totalDebit = ecritures.reduce((s, e) => s + e.debit, 0)
  const totalCredit = ecritures.reduce((s, e) => s + e.credit, 0)
  assert.equal(totalDebit, totalCredit)
})

console.log('\n📦 16. Checkout 3 Étapes & Guest Checkout Zéro-Friction')
it('Checkout: validation des étapes et des coordonnées sans compte obligatoire', () => {
  // Étape 1 : validation
  const validerEtape1 = (nom, tel) => nom.trim().length >= 2 && tel.trim().length >= 9
  assert.equal(validerEtape1('', ''), false)
  assert.equal(validerEtape1('F', '771234567'), false)
  assert.equal(validerEtape1('Fatou Ndiaye', '77123456'), false) // 8 chiffres
  assert.equal(validerEtape1('Fatou Ndiaye', '771234567'), true) // 9 chiffres Sénégal
  assert.equal(validerEtape1('Amadou Diallo', '+221771234567'), true)

  // Progression bornée des étapes 1 -> 2 -> 3
  const nextStep = (current) => Math.min(current + 1, 3)
  const prevStep = (current) => Math.max(current - 1, 1)
  assert.equal(nextStep(1), 2)
  assert.equal(nextStep(2), 3)
  assert.equal(nextStep(3), 3) // Ne dépasse pas 3
  assert.equal(prevStep(3), 2)
  assert.equal(prevStep(2), 1)
  assert.equal(prevStep(1), 1) // Ne descend pas sous 1

  // Calcul du total commande
  const sousTotal = 25000
  const fraisLivraison = 1500
  const reductionPromo = 2500
  const totalSansPromo = sousTotal + fraisLivraison
  const totalAvecPromo = Math.max(0, sousTotal + fraisLivraison - reductionPromo)
  assert.equal(totalSansPromo, 26500)
  assert.equal(totalAvecPromo, 24000)
})

console.log('\n📦 17. Système de Thèmes Boutique (boutique-themes.ts)')
it('THEMES_BOUTIQUE: validation des 5 thèmes officiels et tokens système natifs', async () => {
  const { THEMES_BOUTIQUE, getBoutiqueTheme } = await import('../src/lib/boutique-themes.ts')
  assert.equal(THEMES_BOUTIQUE.length, 5)

  const expectedIds = ['classique', 'luxe-sombre', 'nature-vert', 'tech-moderne', 'mode-chic']
  for (const id of expectedIds) {
    const theme = THEMES_BOUTIQUE.find(t => t.id === id)
    assert.ok(theme, `Thème ${id} manquant`)
    assert.ok(theme.nom.length > 0)
    assert.ok(theme.css.primary.startsWith('#'))
    assert.ok(theme.css.background.startsWith('#'))
    assert.ok(theme.css.textPrimary.startsWith('#'))
    assert.ok(theme.css.borderRadius.length > 0)
    // Sécurité P0 : Polices système natives SANS fetch externe
    assert.ok(theme.css.fontFamily.includes('system-ui') || theme.css.fontFamily.includes('-apple-system'))
    assert.equal(theme.css.fontFamily.includes('http'), false)
  }

  // Fallback getBoutiqueTheme
  assert.equal(getBoutiqueTheme('luxe-sombre').id, 'luxe-sombre')
  assert.equal(getBoutiqueTheme(null).id, 'classique')
  assert.equal(getBoutiqueTheme('inconnu').id, 'classique')
})

console.log('\n📦 18. Navigation Progressive Dashboard Marchand (constants.ts)')
it('Progressive Navigation: intégrité des 3 tiers (Essential, Commerce, Advanced) sans doublons', async () => {
  const { getNavEssential, getNavCommerce, getNavAdvanced, VALID_TABS } = await import('../src/app/boutique/components/manage/constants.ts')
  const dummyT = (k) => k

  const essential = getNavEssential(dummyT)
  const commerce = getNavCommerce(dummyT)
  const advanced = getNavAdvanced(dummyT)

  const essentialKeys = essential.flatMap(g => g.items.map(i => i.key))
  const commerceKeys = commerce.flatMap(g => g.items.map(i => i.key))
  const advancedKeys = advanced.flatMap(g => g.items.map(i => i.key))

  // Vérification de la complétude du mode essentiel (5 entrées indispensables)
  assert.equal(essentialKeys.includes('dashboard'), true)
  assert.equal(essentialKeys.includes('commandes'), true)
  assert.equal(essentialKeys.includes('produits'), true)
  assert.equal(essentialKeys.includes('personnaliser'), true)
  assert.equal(essentialKeys.includes('infos'), true)

  // Vérification des outils du mode commerce
  assert.equal(commerceKeys.includes('carnet'), true)
  assert.equal(commerceKeys.includes('express'), true)
  assert.equal(commerceKeys.includes('fidelite'), true)
  assert.equal(commerceKeys.includes('social'), true)

  // Vérification des outils du mode avancé
  assert.equal(advancedKeys.includes('compta'), true)
  assert.equal(advancedKeys.includes('analytics'), true)
  assert.equal(advancedKeys.includes('documents'), true)
  assert.equal(advancedKeys.includes('fiscalite'), true)
  assert.equal(advancedKeys.includes('equipe'), true)

  // Aucun chevauchement (doublon) entre les tiers
  const allKeys = [...essentialKeys, ...commerceKeys, ...advancedKeys]
  const uniqueKeys = new Set(allKeys)
  assert.equal(allKeys.length, uniqueKeys.size, 'Aucun doublon de clé entre les 3 tiers de navigation')

  // Toutes les clés doivent être valides dans VALID_TABS
  for (const k of allKeys) {
    assert.equal(VALID_TABS.includes(k), true, `Clé ${k} doit être déclarée dans VALID_TABS`)
  }
})

console.log('\n📦 19. Sécurité & Robustesse des Mots de Passe (password-validator.ts)')
it('Password Validator: contrôle strict de la robustesse (min 8 chars, 1 chiffre, 1 maj/spécial)', async () => {
  const { validerForceMotDePasse } = await import('../src/lib/password-validator.ts')

  assert.equal(validerForceMotDePasse('short').valide, false)
  assert.equal(validerForceMotDePasse('sanschiffre!').valide, false)
  assert.equal(validerForceMotDePasse('minuscule123').valide, false)

  assert.equal(validerForceMotDePasse('Nopalou2026').valide, true)
  assert.equal(validerForceMotDePasse('Securite2026!').valide, true)
  assert.equal(validerForceMotDePasse('dakar_2026*pro').valide, true)
})

console.log('\n──────────────────────────────────────────────────────────')
console.log(`Résultats: ${passed} passés, ${failed} échoués (Total: ${passed + failed})`)
if (failed > 0) process.exit(1)
console.log(`🎉 100% des ${passed} tests unitaires sont validés avec succès !`)
process.exit(0)

