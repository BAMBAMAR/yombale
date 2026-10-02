// Sonde AUDIT VOIX n°1 : etapes COMPREHENSION -> EXTRACTION -> MAPPING sur le vrai module frontend-next/src/lib/voice-assistant.ts.
// Aucun reseau, aucune base. Usage : node --experimental-strip-types scripts/audit/voice/01-parser-matrix.mjs [sortie.json]
// Reproduit aussi, a l'identique, le mapping de useKalpeVoice.ts (transcript -> setters) pour montrer ce que le formulaire recevrait.
import fs from 'node:fs'
import {
  parseSaisieExpressIntent, parseDetteIntent, parseAjoutProduitIntent,
  cleanVoiceSearchQuery, extraireMontantCFA, normaliserTexteVocal, NOMBRES_MAPPING,
} from '../../../frontend-next/src/lib/voice-assistant.ts'

const out = { kalpe: [], kalpeDette: [], compta: [], produit: [], recherche: [], pos: [], carnet: [] }

// --- copie fidele du mapping de useKalpeVoice.ts (lignes 76-106) ---
function mapKalpe(transcript, modeUI) {
  const form = { mode: modeUI, montant: '', libelle: '', categorie: '(inchangee)', detteSens: '(inchange)', tiersNom: '' }
  if (modeUI === 'dette') {
    const p = parseDetteIntent(transcript, [], [])
    if (p.montant) form.montant = String(p.montant)
    if (p.nomClient) form.tiersNom = p.nomClient
    if (p.type === 'vente_credit') form.detteSens = 'a_recevoir'
    else if (p.type === 'remboursement') form.detteSens = 'a_payer'
    return { raw: p, form }
  }
  const p = parseSaisieExpressIntent(transcript, modeUI === 'depense' ? 'depense' : 'vente')
  if (p.montant && p.montant > 0) form.montant = String(p.montant)
  const desc = p.libelleProduit || p.description
  if (desc) form.libelle = desc
  if (p.categorie) {
    const m = { ecole: 'École & Scolarité', pressing: 'Pressing & Blanchisserie', transport: 'Transport & Déplacement', loyer: 'Loyer & Charges', stock: 'Fournisseur & Stock' }
    form.categorie = m[p.categorie] || p.categorie
  }
  if (p.mode === 'depense') form.mode = 'depense'
  else if (p.mode === 'vente') form.mode = 'revenu'
  return { raw: p, form }
}

const CATS_DEP = ['Alimentation & Marché','Transport & Déplacement','Carburant & Essence','École & Scolarité','Pressing & Blanchisserie','Factures (Senelec/Woyofal/Eau)','Loyer & Charges','Communication & Forfait','Santé & Pharmacie','Habillement & Couture','Famille & Teranga','Fournisseur & Stock','Dons & Culte','Autre']
const CATS_REV = ['Salaire & Emploi','Prestation & Service','Vente & Commerce','Transfert reçu (Wave/OM)','Tontine','Loyer perçu','Autre']

const phrasesDepense = [
  'Dépense 5000 transport',
  "J'ai dépensé 5000 francs pour le transport",
  "Ce matin j'ai payé 5000 FCFA de transport",
  "J'ai dépensé 5000 francs aujourd'hui pour prendre un taxi",
  "J'ai dépensé 5000 francs",
  "J'ai payé 5000",
  "J'ai payé 3000 francs pour le déjeuner",
  "j'ai dépensé cinq mille francs pour le transport",
  "j'ai dépensé trois mille cinq cents francs au marché",
  "j'ai dépensé 3 500 francs pour le déjeuner",
  "j'ai dépensé deux mille cinq cents francs en essence",
  "dépense 12 mille loyer",
  "j'ai payé 5000 de transport et 2000 de déjeuner",
  'Dépense transport benn téemeer',
  "j'ai acheté du pain pour 500 francs",
  "j'ai payé la scolarité 25000",
  "j'ai donné 10000 à ma mère",
  "j'ai payé 15000 à la pharmacie",
  "j'ai dépensé zéro franc",
  "j'ai dépensé 5000 le 3 octobre pour le transport",
  "j'ai payé 5000 en espèces pour le transport",
  "j'ai payé 5000 par Wave à Moussa pour le transport",
  'dépense 50 000 000',
  'dépense 5000 000',
  "j'ai dépensé 5.000 francs de transport",
  "j'ai dépensé 1 million pour le loyer",
]
for (const t of phrasesDepense) out.kalpe.push({ ui: 'depense', phrase: t, ...mapKalpe(t, 'depense') })

const phrasesRevenu = [
  "Aujourd'hui j'ai reçu 25 000 francs de salaire",
  "j'ai reçu 25000 de salaire",
  'salaire 25000',
  "j'ai reçu 25000",
  "j'ai reçu 10000 de ma tontine",
  "j'ai reçu 15000 de Moussa pour une prestation de coiffure",
  "j'ai gagné 5000 francs",
  'vente café touba 500',
  'Wave reçu 10000',
  "j'ai encaissé 8000 de loyer",
  "j'ai reçu mon salaire de 150 000 francs",
  "le salaire est tombé 200000",
  "j'ai reçu 25000 pour le transport de marchandises",
]
for (const t of phrasesRevenu) out.kalpe.push({ ui: 'revenu', phrase: t, ...mapKalpe(t, 'revenu') })

// Onglet par defaut du bouton FAB 'dicter' = DEPENSE : un revenu dicte depuis cet onglet
for (const t of ["Aujourd'hui j'ai reçu 25 000 francs de salaire", "j'ai reçu 25000", "j'ai gagné 5000 francs", 'Wave reçu 10000', "on m'a envoyé 10000", 'tontine 10000 reçue']) out.kalpe.push({ ui: 'depense', phrase: t, ...mapKalpe(t, 'depense') })
// Phrases dites alors que l'onglet n'est PAS depense/revenu
for (const t of ["je mets 10000 de côté pour mon voyage", "j'ai versé 5000 sur mon épargne"]) out.kalpe.push({ ui: 'epargne', phrase: t, ...mapKalpe(t, 'epargne') })
for (const t of ['vente robe wax 15000']) out.kalpe.push({ ui: 'vente_express', phrase: t, ...mapKalpe(t, 'vente_express') })
for (const t of ['dépense 5000 transport']) out.kalpe.push({ ui: 'revenu', phrase: t, ...mapKalpe(t, 'revenu') })

const phrasesDette = [
  'Moussa me doit 10000',
  'Je dois 20000 à Moussa',
  'Dette Moussa 10 000',
  'Bor Fatou benn junni',
  "J'ai prêté 10000 à Awa",
  "J'ai emprunté 15000 à Awa",
  "Awa m'a remboursé 5000",
  'Moussa Diop me doit 10000 francs avant vendredi',
  'créance école Sainte Marie 50000',
  'Je dois 30000 à la Senelec',
  'Fey bor Aminata 2500',
  'Moussa 77 123 45 67 me doit 10000',
]
for (const t of phrasesDette) out.kalpeDette.push({ ui: 'dette', phrase: t, ...mapKalpe(t, 'dette') })

// --- extraction du montant isolee ---
const montants = [
  '5000', '5 000', '5000 francs', 'cinq mille', 'cinq mille francs', 'trois mille cinq cents', 'trois mille', 'deux mille',
  'deux mille cinq cents', 'quatre mille cinq cents', 'sept mille', 'dix mille', 'douze mille cinq cents', 'vingt mille', 'vingt-cinq mille',
  'cent cinquante mille', 'cent vingt mille', 'soixante-quinze mille', 'quatre-vingt mille', 'quatre vingt dix mille', 'un million', 'deux millions',
  '2,5 mille', '2.5 k', '10k', '10 mille', 'benn téemeer', 'ñaari junni', 'ñetti téemeer', 'juroom junni', 'fukk junni', 'junni ak téemeer',
  'cinq cents', 'mille', 'mille deux cents', 'huit cent mille', 'six cent mille', '1 500 000', '100 000 000', 'zéro', '12', '5000 et 2000',
  '77 123 45 67 dix mille', 'ñaari téemeer ak fukk',
]
for (const m of montants) out.montants = (out.montants || []).concat([{ phrase: m, montant: extraireMontantCFA(m) }])

// --- Compta express (useComptaSaisieVoice) : mapping direct, mode passe tel quel ---
for (const [mode, t] of [['depense', "j'ai payé la scolarité 25000"], ['depense', 'pressing 3000'], ['vente', 'dépense 5000 transport'], ['depense', 'vente café touba 500'], ['depense', 'salaire gardien 40000'], ['depense', 'impôt patente 20000'], ['depense', 'marketing flyers 15000']]) {
  const p = parseSaisieExpressIntent(t, mode)
  out.compta.push({ phrase: t, modeUI: mode, categorieSlug: p.categorie, existeDansCATEGORIES_CONFIG: ['transport','stock','loyer','salaires','marketing','fournitures','taxes','autre'].includes(p.categorie) , montant: p.montant, description: p.description || p.libelleProduit, intentMode: p.mode })
}

// --- Produit ---
for (const t of ['Robe Bazin brodé quinze mille', 'Lait Bonnet Rouge 1L 500', 'Sac à main en cuir ñaari junni', 'Chaussure de sport Nike', 'ajouter iPhone 12 à 350000', 'Savon 2 pièces 1500', 'Riz 50kg 25000', 'Thé Lipton 25 sachets 1200', 'Tissu wax 6 yards cinq mille', "Pagne 3 mètres deux mille cinq cents"]) out.produit.push({ phrase: t, ...parseAjoutProduitIntent(t) })

// --- Recherche ---
for (const t of ['Cherche robe en wax', "Trouve-moi des chaussures", 'je veux un iPhone', 'iphone 13 pro', "recherche"]) out.recherche.push({ phrase: t, resultat: cleanVoiceSearchQuery(t) })

// --- POS : copie fidele de la detection quantite + montant de PosVoiceInput.traiterCommandeVocale (lignes 85-99) ---
function posQtyMontant(texte) {
  const clean = normaliserTexteVocal(texte)
  let quantite = 1
  for (const [mot, val] of Object.entries(NOMBRES_MAPPING)) {
    if (new RegExp(`\\b${mot}\\b`, 'i').test(clean)) { quantite = val; break }
  }
  const montant = extraireMontantCFA(clean)
  return { clean, quantite, montant, totalSiLibre: montant ? montant * quantite : null }
}
for (const t of ['5000 FCFA', '2 Café Touba', 'cinq mille francs', '10 mille', '10k', 'benn junni', 'ñaari junni', 'ñaari téemeer', 'deux cafés touba', 'trois mille cinq cents', 'vente 2500', 'un café touba', 'mille francs', 'vingt mille', 'café touba 1000', 'café touba 100', 'riz 15000', 'deux riz 15000', 'sucre 20', 'poulet dix mille', 'cinq cents francs']) out.pos.push({ phrase: t, ...posQtyMontant(t) })

// --- Carnet : mapping de useCarnetVoice (client connu) ---
const clients = ['Moussa Diop', 'Fatou Sall', 'Awa Ndiaye', 'Amadou Ba']
for (const t of ['Dette Moussa 10 000', 'Moussa a payé 5000', 'Fatou me doit 7500', 'Moussa Diop', 'bonjour', 'Dette Moussa', 'Moussa 5000', 'Remboursement Aminata 5000', 'Amadou doit cinq mille', 'Awa a remboursé 2000 francs']) out.carnet.push({ phrase: t, intent: parseDetteIntent(t, clients, []) })

const dest = process.argv[2]
const json = JSON.stringify(out, null, 2)
if (dest) fs.writeFileSync(dest, json)
// Affichage compact
for (const k of ['kalpe', 'kalpeDette']) {
  console.log(`\n=== ${k} ===`)
  for (const r of out[k]) {
    const f = r.form
    const catOK = f.categorie === '(inchangee)' ? '' : (r.form.mode === 'depense' ? CATS_DEP : CATS_REV).includes(f.categorie) ? ' [chip OK]' : ' [chip INTROUVABLE]'
    console.log(`[UI ${r.ui}] « ${r.phrase} »\n   -> mode=${f.mode} montant=${f.montant || '(vide)'} libelle=${JSON.stringify(f.libelle)} categorie=${f.categorie}${catOK} sens=${f.detteSens} tiers=${JSON.stringify(f.tiersNom)}`)
  }
}
for (const k of ['montants', 'compta', 'produit', 'recherche', 'pos', 'carnet']) {
  console.log(`\n=== ${k} ===`)
  for (const r of out[k]) console.log(JSON.stringify(r))
}
