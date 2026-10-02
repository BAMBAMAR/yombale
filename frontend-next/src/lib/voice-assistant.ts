// frontend-next/src/lib/voice-assistant.ts
/**
 * Moteur universel de reconnaissance vocale et de parsing bilingue Wolof & Français pour Nopalou.
 * Gère le code-switching naturel ("Dépense transport benn téemeer", "Bor Moussa 10 000", "Vente 1 junni").
 */

// 1. Dictionnaire phonétique des nombres en Wolof et Français
export const NOMBRES_MAPPING: Record<string, number> = {
  // Français
  'un': 1, 'une': 1, '1': 1,
  'deux': 2, '2': 2,
  'trois': 3, '3': 3,
  'quatre': 4, '4': 4,
  'cinq': 5, '5': 5,
  'six': 6, '6': 6,
  'sept': 7, '7': 7,
  'huit': 8, '8': 8,
  'neuf': 9, '9': 9,
  'dix': 10, '10': 10,
  'quinze': 15, '15': 15,
  'vingt': 20, '20': 20,
  'trente': 30, '30': 30,
  'quarante': 40, '40': 40,
  'cinquante': 50, '50': 50,
  'cent': 100, '100': 100,
  'mille': 1000, '1000': 1000,

  // Wolof & variantes phonétiques
  'benn': 1, 'ben': 1, 'benni': 1,
  'naar': 2, 'ñaar': 2, 'niar': 2, 'gnari': 2, 'gnaar': 2, 'naari': 2, 'ñaari': 2, 'niari': 2,
  'nett': 3, 'ñett': 3, 'gnett': 3, 'niett': 3, 'netti': 3, 'ñetti': 3,
  'neent': 4, 'ñeent': 4, 'gneent': 4, 'nient': 4, 'neenti': 4, 'ñeenti': 4,
  'juroom': 5, 'juróom': 5, 'diourom': 5, 'djourom': 5, 'juroomi': 5, 'juróomi': 5,
  'fukk': 10, 'fuk': 10, 'fouk': 10, 'fukki': 10,
}

// 2. Unités monétaires Wolof courantes (en Francs CFA)
// Téemeer = 500 FCFA (pièce de 100 riyals / 500 F)
// Junni = 5 000 FCFA (billet de 1000 riyals / 5 000 F)
export const DEVISES_WOLOF: Record<string, number> = {
  'teemeer': 500,
  'téemeer': 500,
  'temeer': 500,
  'temere': 500,
  'temer': 500,
  'témer': 500,
  'junni': 5000,
  'djunni': 5000,
  'douni': 5000,
  'juni': 5000,
  'djouni': 5000,
  'dioni': 5000,
}

/**
 * Nettoie et normalise une chaîne transcrite (minuscules, sans accents, sans ponctuation excessive, espaces insécables).
 */
export function normaliserTexteVocal(texte: string): string {
  if (!texte) return ''
  let res = texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // IMPORTANT : Préserver les décimales entre deux chiffres (ex: 2.5 ou 2,5 -> 2.5) avant de supprimer la ponctuation
  res = res.replace(/(\d+)[,.](\d+)/g, '$1DOTDECIMAL$2')

  // Supprimer la ponctuation résiduelle
  res = res.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ')

  // Restaurer le point décimal
  res = res.replace(/DOTDECIMAL/g, '.')

  res = res
    .replace(/[\u00a0\u202f\u2007\u2009\u200a]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Fusionner les milliers écrits avec un espace (ex: "10 000" -> "10000", "5 000" -> "5000", "150 000" -> "150000")
  res = res.replace(/\b(\d{1,4})\s+(\d{3})\b/g, '$1$2')
  return res
}

/**
 * Extrait une quantité ou un multiplicateur (ex: "deux", "ñaari", "3").
 */
export function extraireQuantite(cleanText: string): number {
  const mots = cleanText.split(/\s+/)
  for (const mot of mots) {
    if (NOMBRES_MAPPING[mot]) {
      return NOMBRES_MAPPING[mot]
    }
  }
  return 1
}

// ── Extraction de montants (AUD-199) : analyseur compositionnel, plus de table figée ──────────────

const MOTS_UNITES: Record<string, number> = {
  un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16,
  vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60, quatrevingt: 80,
}

/** Valeur d'une suite de mots-nombres français (« trois mille cinq cents » = 3500). */
function evaluerMotsNombres(tokens: string[]): { valeur: number; grand: boolean } {
  let total = 0
  let courant = 0
  let grand = false
  for (const t of tokens) {
    if (t === 'et') continue
    if (t in MOTS_UNITES) courant += MOTS_UNITES[t]
    else if (t === 'cent' || t === 'cents') { courant = (courant || 1) * 100; grand = true }
    else if (t === 'mille') { total += (courant || 1) * 1000; courant = 0; grand = true }
    else if (t === 'million' || t === 'millions') { total += (courant || 1) * 1000000; courant = 0; grand = true }
  }
  return { valeur: total + courant, grand }
}

function motEstNombre(t: string): boolean {
  return t in MOTS_UNITES || t === 'cent' || t === 'cents' || t === 'mille' || t === 'million' || t === 'millions'
}

/**
 * Tous les montants FCFA détectés, dans l'ordre de la phrase.
 * Gère : devises wolof composées (« junni ak téemeer » = 5 500), « 10 mille », « 10k », « 2,5 mille »,
 * « 1 million », « 1 500 000 », « 5.000 », nombres en lettres composés (« cent cinquante mille », « quatre vingt dix mille »).
 */
export function analyserMontants(cleanText: string): { montants: number[]; reste: string } {
  if (!cleanText) return { montants: [], reste: '' }
  let t = normaliserTexteVocal(cleanText)

  // Neutraliser les numéros de téléphone sénégalais (9 chiffres commençant par 70, 75, 76, 77, 78, 33)
  t = t.replace(/(?:\+?221\s*)?(?:7[05678]|33)(?:\s*\d{3}\s*\d{2}\s*\d{2}|\s*\d{2}\s*\d{2}\s*\d{3}|\s*\d{7})\b/g, ' ')

  // 0. Devises wolof : somme de toutes les occurrences, chacune avec son multiplicateur (« ñaari téemeer ak junni »)
  const mots = t.split(/\s+/).filter(Boolean)
  let sommeWolof = 0
  let wolof = false
  mots.forEach((m, i) => {
    const base = DEVISES_WOLOF[m]
    if (!base) return
    wolof = true
    const avant = mots[i - 1]
    let mult = 1
    if (avant && NOMBRES_MAPPING[avant] && !DEVISES_WOLOF[avant]) mult = NOMBRES_MAPPING[avant]
    else if (avant && /^\d+$/.test(avant)) mult = parseInt(avant, 10)
    sommeWolof += mult * base
  })
  if (wolof) {
    const reste = mots.filter((m, i) => !DEVISES_WOLOF[m] && !(DEVISES_WOLOF[mots[i + 1]] && (NOMBRES_MAPPING[m] || /^\d+$/.test(m)))).join(' ')
    return { montants: [sommeWolof], reste }
  }

  const trouves: Array<{ pos: number; val: number }> = []
  const consommes: Array<[number, number]> = []
  const dejaPris = (a: number, b: number) => consommes.some(([x, y]) => a < y && b > x)
  const ajouter = (pos: number, fin: number, val: number) => {
    if (!Number.isFinite(val) || val <= 0 || dejaPris(pos, fin)) return
    consommes.push([pos, fin])
    trouves.push({ pos, val })
  }

  // 1. « chiffre + mille/k/million(s) » : 10 mille, 10k, 2.5 mille, 1 million, 2,5 millions
  const reMult = /\b(\d+(?:\.\d+)?)\s*(millions?|mille|mil|k)\b/g
  let m: RegExpExecArray | null
  while ((m = reMult.exec(t))) {
    const facteur = m[2].startsWith('million') ? 1000000 : 1000
    ajouter(m.index, m.index + m[0].length, Math.round(parseFloat(m[1]) * facteur))
  }

  // 2. Chiffres groupés par milliers : « 1500 000 », « 1 500 000 », « 5.000 »
  const reGroupes = /\b(\d{1,9})((?:\s\d{3})+)\b/g
  while ((m = reGroupes.exec(t))) ajouter(m.index, m.index + m[0].length, parseInt(m[1] + m[2].replace(/\s/g, ''), 10))
  const reMilliersPoint = /\b(\d{1,3})\.(\d{3})\b(?!\s*(?:k|mille|mil|million))/g
  while ((m = reMilliersPoint.exec(t))) ajouter(m.index, m.index + m[0].length, parseInt(m[1] + m[2], 10))

  // 3. Nombres en lettres (suites de mots-nombres), « quatre vingt(s) » ramené à un seul mot
  const tLettres = t.replace(/\bquatre vingts?\b/g, 'quatrevingt')
  const reMots = /[a-z]+/g
  const run: Array<{ mot: string; pos: number; fin: number }> = []
  const viderRun = () => {
    if (run.length) {
      const { valeur, grand } = evaluerMotsNombres(run.map(r => r.mot))
      // Un petit nombre isolé (« deux », « trois ») est une quantité, pas un montant
      if (grand || valeur >= 100) ajouter(run[0].pos, run[run.length - 1].fin, valeur)
    }
    run.length = 0
  }
  let dernierFin = -1
  while ((m = reMots.exec(tLettres))) {
    const mot = m[0]
    const suit = dernierFin >= 0 && /^\s+$/.test(tLettres.slice(dernierFin, m.index))
    if (motEstNombre(mot) || (mot === 'et' && run.length)) {
      if (run.length && !suit) viderRun()
      run.push({ mot, pos: m.index, fin: m.index + mot.length })
    } else {
      viderRun()
    }
    dernierFin = m.index + mot.length
  }
  viderRun()
  // « et » final orphelin ne change pas la valeur (ignoré par evaluerMotsNombres)

  // 4. Chiffres seuls
  const reChiffres = /\b\d{3,9}\b/g
  while ((m = reChiffres.exec(t))) ajouter(m.index, m.index + m[0].length, parseInt(m[0], 10))
  if (!trouves.length) {
    const reDeux = /\b\d{2}\b/g
    while ((m = reDeux.exec(t))) {
      const n = parseInt(m[0], 10)
      if (![77, 78, 76, 75, 70, 33].includes(n)) ajouter(m.index, m.index + 2, n)
    }
  }

  const chars = t.split('')
  for (const [a, b] of consommes) for (let k = a; k < b && k < chars.length; k++) chars[k] = ' '
  return { montants: trouves.sort((a, b) => a.pos - b.pos).map(x => x.val), reste: chars.join('').replace(/\s+/g, ' ').trim() }
}

/** Tous les montants FCFA détectés, dans l'ordre de la phrase. */
export function extraireMontantsCFA(cleanText: string): number[] {
  return analyserMontants(cleanText).montants
}

/**
 * Extrait UN montant en FCFA (le plus grand quand la phrase en contient plusieurs ; utiliser
 * `extraireMontantsCFA` pour détecter l'ambiguïté).
 */
export function extraireMontantCFA(cleanText: string): number | null {
  const liste = extraireMontantsCFA(cleanText)
  if (!liste.length) return null
  return Math.max(...liste)
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsers spécialisés par section de Nopalou
// ─────────────────────────────────────────────────────────────────────────────

export interface SaisieExpressIntent {
  mode: 'depense' | 'vente'
  montant: number | null
  categorie?: 'loyer' | 'stock' | 'transport' | 'salaires' | 'marketing' | 'fournitures' | 'taxes' | 'ecole' | 'pressing' | 'autre'
  /** Libellé de puce Sama Xaalis (dépense) — toujours une valeur de CATEGORIES_DEPENSE */
  categorieKalpe?: string
  /** Libellé de puce Sama Xaalis (revenu) — toujours une valeur de CATEGORIES_REVENU */
  categorieRevenuKalpe?: string
  description?: string
  libelleProduit?: string
}

const sansAccents = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const MOTS_VIDES_LIBELLE = new Set([
  'j', 'ai', 'je', 'me', 'm', 'a', 'as', 'ete', 'suis', 'on', 'il', 'elle', 'pour', 'de', 'du', 'des', 'd', 'le', 'la', 'les', 'l',
  'un', 'une', 'au', 'aux', 'en', 'ce', 'cet', 'cette', 'ca', 'et', 'ou', 'mon', 'ma', 'mes', 'ton', 'ta', 'sur', 'dans', 'par', 'avec',
  'matin', 'soir', 'midi', 'aujourd', 'hui', 'aujourdhui', 'hier', 'demain', 'maintenant', 'tout', 'juste',
  'depense', 'depenses', 'depans', 'depanse', 'paye', 'payer', 'paiement', 'achete', 'recu', 'recue', 'recus', 'encaisse', 'encaissee',
  'gagne', 'gagnee', 'percu', 'percue', 'tombe', 'envoye', 'donne', 'vire', 'verse', 'vente', 'ventes', 'jaay', 'jaaye', 'jaayi',
  'est', 'zero', 'francs', 'franc', 'fcfa', 'cfa', 'frs', 'f', 'euro', 'euros', 'recette', 'recettes', 'encaissement', 'dette', 'charge', 'charges', 'sortie', 'sorties',
])

const MOTS_NOMBRES_LIBELLE = new Set<string>([
  ...Object.keys(MOTS_UNITES_PUBLICS()),
  'cent', 'cents', 'mille', 'million', 'millions', 'k',
  ...Object.keys(NOMBRES_MAPPING).map(sansAccents),
  ...Object.keys(DEVISES_WOLOF).map(sansAccents),
])

function MOTS_UNITES_PUBLICS(): Record<string, number> {
  return {
    un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13,
    quatorze: 14, quinze: 15, seize: 16, vingt: 20, vingts: 20, trente: 30, quarante: 40, cinquante: 50, soixante: 60,
  }
}

/**
 * AUD-203 : libellé construit à partir de la parole d'ORIGINE (accents et casse conservés),
 * en retirant montants, verbes d'amorce et mots vides — et non à partir du texte normalisé.
 */
export function libelleDepuisTranscript(transcript: string, motsExclus: string[] = []): string {
  const exclus = new Set(motsExclus.map(sansAccents))
  const garde: string[] = []
  for (const brut of transcript.replace(/[’']/g, ' ').split(/\s+/)) {
    const w = brut.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
    if (!w) continue
    const n = sansAccents(w).replace(/-/g, ' ')
    if (/^\d/.test(n)) continue
    if (MOTS_VIDES_LIBELLE.has(n) || MOTS_NOMBRES_LIBELLE.has(n) || exclus.has(n)) continue
    if (n.includes(' ') && n.split(' ').every(p => MOTS_NOMBRES_LIBELLE.has(p))) continue
    garde.push(w)
  }
  const texte = garde.join(' ').trim()
  return texte ? texte.charAt(0).toUpperCase() + texte.slice(1) : ''
}

/** AUD-202 : catégorie de puce Sama Xaalis (dépense) déduite des mots dictés. Toujours une valeur valide. */
export function categorieKalpeDepense(clean: string): string {
  const t = clean
  const re = (r: RegExp) => r.test(t)
  if (re(/\b(ecole|scolarite|mensualite|etudes|inscription|daara|creche|universite|college|lycee)\b/)) return 'École & Scolarité'
  if (re(/\b(pressing|blanchisserie|repassage|lavage|teinturerie)\b/)) return 'Pressing & Blanchisserie'
  if (re(/\b(essence|carburant|gasoil|gazoil|diesel)\b/)) return 'Carburant & Essence'
  if (re(/\b(transport|transports|taxi|taxis|tiak|tiaktiak|clando|peage|autoroute|car rapide|bus|ndiaga)\b/)) return 'Transport & Déplacement'
  if (re(/\b(woyofal|senelec|sde|sen eau|seneau|electricite|eau|facture|factures)\b/)) return 'Factures (Senelec/Woyofal/Eau)'
  if (re(/\b(loyer|loyers|bail|caution)\b/)) return 'Loyer & Charges'
  if (re(/\b(sonatel|orange|wifi|forfait|credit telephone|recharge|internet|data)\b/)) return 'Communication & Forfait'
  if (re(/\b(pharmacie|medicament|medicaments|hopital|docteur|medecin|consultation|ordonnance|clinique|sante)\b/)) return 'Santé & Pharmacie'
  if (re(/\b(couture|tailleur|couturier|habit|habits|vetement|vetements|tissu|chaussure|chaussures|robe)\b/)) return 'Habillement & Couture'
  if (re(/\b(famille|mere|pere|maman|papa|frere|soeur|enfant|enfants|bebe|cousin|oncle|tante|teranga|bapteme|mariage|deces)\b/)) return 'Famille & Teranga'
  if (re(/\b(don|dons|sadaka|aumone|mosquee|eglise|zakat|touba|serigne|offrande|culte)\b/)) return 'Dons & Culte'
  if (re(/\b(stock|marchandise|marchandises|fournisseur|approvisionnement|reappro|colis)\b/)) return 'Fournisseur & Stock'
  if (re(/\b(dejeuner|diner|repas|manger|pain|riz|marche|poisson|viande|legume|legumes|nourriture|thieb|ndekki|courses|epicerie|petit dejeuner|cafe|lait|sucre|huile)\b/)) return 'Alimentation & Marché'
  return 'Autre'
}

/** AUD-197/202 : catégorie de puce Sama Xaalis (revenu). */
export function categorieKalpeRevenu(clean: string): string {
  if (/\b(salaire|paie|paye mensuelle|traitement)\b/.test(clean)) return 'Salaire & Emploi'
  if (/\b(tontine|natt)\b/.test(clean)) return 'Tontine'
  if (/\b(loyer|loyers)\b/.test(clean)) return 'Loyer perçu'
  if (/\b(wave|om|orange money|virement|transfert|envoye|envoyee|viré|vire|western|moneygram)\b/.test(clean)) return 'Transfert reçu (Wave/OM)'
  if (/\b(prestation|service|services|coiffure|couture|reparation|travail|mission|cours|livraison)\b/.test(clean)) return 'Prestation & Service'
  if (/\b(vente|ventes|vendu|jaay|client|clients|commerce|recette|recettes)\b/.test(clean)) return 'Vente & Commerce'
  return 'Autre'
}

/** Verbes de RÉCEPTION d'argent : le sens de la phrase prime sur les mots de catégorie (AUD-197). */
function detecterReception(clean: string): boolean {
  if (/\b(recu|recue|recus|recois|recevoir|percu|percue|gagne|gagnee|gagner|encaisse|encaissee|encaisser|tombe|rentre|rentree|touche)\b/.test(clean)) return true
  if (/\b(on|il|elle|ils|elles|m|me)\s+(a|ont|as)?\s*(paye|payee|envoye|envoyee|donne|donnee|vire|viree|verse|versee)\b/.test(clean)) return true
  if (/\bm\s+(a|ont)\s+(paye|envoye|donne|vire|verse)\b/.test(clean)) return true
  return false
}

/**
 * Parse vocal pour la Saisie Express Comptable et Sama Xaalis.
 * Le SENS (reçu / payé) est décidé par le verbe avant la catégorie ; en cas d'ambiguïté totale,
 * l'onglet courant tranche.
 */
export function parseSaisieExpressIntent(transcript: string, modeActuel?: 'vente' | 'depense'): SaisieExpressIntent {
  const clean = normaliserTexteVocal(transcript)
  const montant = extraireMontantCFA(clean)

  const reception = detecterReception(clean)
  // Verbes de sortie explicites (« m'a payé » = réception, retiré avant ce test)
  const cleanSansReception = clean.replace(/\b(on|il|elle|ils|elles|m|me)\s+(a|ont|as)?\s*(paye|payee|envoye|envoyee|donne|donnee|vire|viree|verse|versee)\b/g, ' ')
  const hasMotCleDepense = /\b(depense|depenses|depans|depanse|depanser|depanseur|charge|charges|sortie|sorties|payer|paye|payee|paiement|paiements|achete|facture|factures|frais|perte|pertes|decaissement|decaissements|remboursement|rembourser|dette|reglement)\b/.test(cleanSansReception)

  const isEcole = /\b(ecole|scolarite|mensualite|etudes|fournitures scolaires|inscription|daara|creche|universite|college|lycee)\b/.test(clean)
  const isPressing = /\b(pressing|blanchisserie|repassage|lavage|linge|nettoyage vetement|teinturerie)\b/.test(clean)
  const isTransport = /\b(transport|transports|essence|carburant|gasoil|gazoil|diesel|taxi|taxis|tiak|tiaktiak|clando|peage|autoroute)\b/.test(clean)
  const isLoyer = /\b(loyer|loyers|magasin|bail|locataire)\b/.test(clean)
  const isFourniture = /\b(fourniture|fournitures|sachet|sachets|emballage|emballages|carton|cartons|papier|papiers|scotch|etiquette|etiquettes|sac|sacs|sacs plastiques|sac plastique)\b/.test(clean)
  const isSalaire = /\b(salaire|salaires|employe|employes|personnel|gardien|commission|commissions|avance salaire)\b/.test(clean)
  const isTaxes = /\b(taxe|taxes|impot|impots|patente|mairie|douane|fiscalite)\b/.test(clean)
  const isChargesCourantes = /\b(woyofal|senelec|sde|sen eau|seneau|electricite|eau|sonatel|orange|wifi|forfait|credit telephone|repas|dejeuner|diner|manger|thieb|ndekki|nourriture|recharge)\b/.test(clean)
  const isAchatStock = /\b(achat stock|achat fournisseur|achat marchandise|approvisionnement|reappro)\b/.test(clean)
  const hasMotCleVente = /\b(vente|ventes|jaay|jaaye|jaayi|vendre|vendu|vendus|encaissement|recette|recettes)\b/.test(clean)

  const categorieFlag = isEcole || isPressing || isTransport || isLoyer || isFourniture || isSalaire || isTaxes || isChargesCourantes || isAchatStock

  let isDepense: boolean
  if (reception && !hasMotCleDepense) isDepense = false // « j'ai reçu 25 000 de salaire » = revenu
  else if (hasMotCleDepense) isDepense = true
  else if (hasMotCleVente) isDepense = false
  else if (/\bsalaire\b/.test(clean) && !/\b(gardien|employe|employes|personnel|avance)\b/.test(clean) && !(isEcole || isPressing || isTransport || isLoyer || isFourniture || isTaxes || isChargesCourantes || isAchatStock) && modeActuel === 'vente') isDepense = false // « salaire 25000 » dans l'onglet Revenu
  else if (categorieFlag) isDepense = true
  else isDepense = modeActuel === 'depense'

  if (isDepense) {
    let cat: SaisieExpressIntent['categorie'] = 'autre'
    let descDefaut = 'Dépense'
    if (isEcole) { cat = 'ecole'; descDefaut = 'Frais de scolarité / École' }
    else if (isPressing) { cat = 'pressing'; descDefaut = 'Pressing / Blanchisserie' }
    else if (isTransport) { cat = 'transport'; descDefaut = 'Frais de transport' }
    else if (isLoyer) { cat = 'loyer'; descDefaut = 'Paiement loyer' }
    else if (isFourniture) { cat = 'fournitures'; descDefaut = 'Fournitures / Emballages' }
    else if (isAchatStock || /\b(stock|marchandise|fournisseur|achat|colis)\b/.test(clean)) { cat = 'stock'; descDefaut = 'Achat de stock' }
    else if (isSalaire) { cat = 'salaires'; descDefaut = 'Salaires / Équipe' }
    else if (/\b(marketing|pub|publicite|sponsor|flyer|flyers)\b/.test(clean)) { cat = 'marketing'; descDefaut = 'Marketing / Publicité' }
    else if (isTaxes) { cat = 'taxes'; descDefaut = 'Taxes / Impôts' }

    return {
      mode: 'depense',
      montant: montant || 0,
      categorie: cat,
      categorieKalpe: categorieKalpeDepense(clean),
      description: libelleDepuisTranscript(transcript) || descDefaut,
    }
  }

  const libelle = libelleDepuisTranscript(transcript)
  return {
    mode: 'vente',
    montant: montant || 0,
    categorieRevenuKalpe: categorieKalpeRevenu(clean),
    libelleProduit: libelle || undefined,
  }
}

export interface DetteIntent {
  type: 'vente_credit' | 'remboursement' | 'recherche'
  nomClient?: string
  montant: number | null
}

/**
 * Parse vocal pour le Carnet de Dettes Client :
 * Exemples :
 * - "Dette Moussa 10 000" -> vente_credit, client "Moussa", 10000
 * - "Bor Fatou benn junni" -> vente_credit, client "Fatou", 5000
 * - "Remboursement Moussa 5000" -> remboursement, client "Moussa", 5000
 * - "Fey bor Aminata 2500" -> remboursement, client "Aminata", 2500
 * - "Moussa Diallo" -> recherche
 */
export function parseDetteIntent(transcript: string, listeClientsConnus: string[] = [], alternatives: string[] = []): DetteIntent {
  // Essayer d'abord avec le transcript principal, puis avec les alternatives si besoin
  const listesATester = [transcript, ...(alternatives.filter(a => a && a !== transcript))]

  for (const phrase of listesATester) {
    const clean = normaliserTexteVocal(phrase)
    const montant = extraireMontantCFA(clean)

    // Mots clés de remboursement avec variantes phonétiques fréquentes issues de la reconnaissance vocale
    // Wolof "fey" / "feyna" souvent transcrit par les moteurs FR en "faye", "faillite", "fait", "fais", "paye"
    const isRemboursement = /\b(remboursement|remboursements|rembourser|rembourse|paiement|paiements|payer|paye|payé|payee|a paye|a payé|acompte|acomptes|solde|solder|fey|feyna|feye|faye|faillite|versement|versements|verser|verse|versé|regler|reglement|regle|reglé|rendu|rendre)\b/i.test(clean)

    // Mots clés de dette / crédit avec variantes phonétiques fréquentes issues de la reconnaissance vocale
    // Wolof "bor" souvent transcrit par les moteurs FR en "bord", "bore", "boire", "bon", "port", "pour"
    // Français "doit" souvent transcrit en "dois", "doigt"
    // Français "dette" souvent transcrit en "date", "dates", "d'aide"
    const isCredit = /\b(dette|dettes|date|dates|credit|credits|keredit|bor|bore|bord|borde|boire|bon|port|pour|doit|dois|doigt|prete|preter|avancer|avance|achat)\b/i.test(clean)

    // 1. Chercher d'abord parmi les clients connus
    let clientTrouve: string | undefined

    // a) Correspondance directe ou inclusion du nom
    for (const cNom of listeClientsConnus) {
      const cClean = normaliserTexteVocal(cNom)
      if (clean.includes(cClean)) {
        clientTrouve = cNom
        break
      }
    }

    // b) Correspondance sur chaque mot (prénom ou nom de famille >= 3 lettres)
    if (!clientTrouve) {
      for (const cNom of listeClientsConnus) {
        const parts = cNom.split(/\s+/).map(p => normaliserTexteVocal(p)).filter(p => p.length >= 3)
        for (const part of parts) {
          const regex = new RegExp(`\\b${part}\\b`, 'i')
          if (regex.test(clean)) {
            clientTrouve = cNom
            break
          }
        }
        if (clientTrouve) break
      }
    }

    // 2. Si pas trouvé dans les clients connus, extraire le prénom/nom dicté
    if (!clientTrouve) {
      // Neutraliser les numéros de téléphone sénégalais dictés
      const cleanSansTel = clean.replace(/(?:\+?221\s*)?(?:7[05678]|33)\s*\d{3}\s*\d{2}\s*\d{2}/g, ' ')
        .replace(/(?:\+?221\s*)?(?:7[05678]|33)\d{7}/g, ' ')

      const sansMotsCles = cleanSansTel
        .replace(/\b(bonjour|bonsoir|salam|salut|allo|allô|merci|stp|svp|dette|dettes|date|dates|credit|credits|bor|bore|bord|borde|boire|bon|port|pour|keredit|doit|dois|doigt|doivent|doive|prete|preter|avancer|avance|remboursement|remboursements|rembourser|rembourse|paiement|paiements|acompte|acomptes|solde|solder|fey|feyna|faye|faillite|payer|paye|payé|versement|versements|verser|regler|reglement|cherche|trouve|voir|client|pour|de|du|des|le|la|bu|ci|ak|ajoute|ajouter|ajout|mettre|met|donne|donner|note|noter|enregistre|enregistrer|nouveau|nouvelle|prend|prendre|pris)\b/gi, ' ')
        .replace(/\b(\d{1,8})\b/g, ' ')
        .replace(/\b(teemeer|téemeer|temeer|junni|djunni|cfa|fcfa|frs|francs|f|euro|euros)\b/gi, ' ')
        .replace(/\b(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|cent|mille|million|benn|naar|ñaar|nett|ñett|juroom|fukk)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (sansMotsCles && sansMotsCles.length >= 2) {
        clientTrouve = sansMotsCles
          .split(/\s+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      }
    }

    // Si on a trouvé un montant OU un client OU un mot clé fort dans cette alternative, on renvoie le résultat
    if (montant || isCredit || isRemboursement || clientTrouve) {
      if (isRemboursement) {
        return {
          type: 'remboursement',
          nomClient: clientTrouve,
          montant: montant || null
        }
      }

      // Règle d'or : si un montant est mentionné dans le carnet, c'est TOUJOURS une vente à crédit (dette) sauf mot de remboursement
      if (isCredit || (montant && montant > 0)) {
        return {
          type: 'vente_credit',
          nomClient: clientTrouve,
          montant: montant || null
        }
      }

      return {
        type: 'recherche',
        nomClient: clientTrouve,
        montant: null
      }
    }
  }

  // Si rien de concluant
  return {
    type: 'recherche',
    nomClient: undefined,
    montant: null
  }
}

/**
 * Nettoie une recherche Marketplace dictée à la voix :
 * "Cherche robe en wax" -> "robe en wax"
 * "Trouve-moi des chaussures" -> "chaussures"
 */
export function cleanVoiceSearchQuery(transcript: string): string {
  const clean = normaliserTexteVocal(transcript)
  return clean
    .replace(/\b(cherche|chercher|trouve|trouver|moi|donne|je veux|recherche)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Analyse une dictée pour l'ajout ou la mise en vente d'un produit.
 * Exemples :
 * - "Robe Bazin brodé quinze mille" -> { nom: "Robe Bazin brodé", prix: 15000 }
 * - "Lait Bonnet Rouge 1L 500" -> { nom: "Lait Bonnet Rouge 1L", prix: 500 }
 * - "Sac à main en cuir ñaari junni" -> { nom: "Sac à main en cuir", prix: 10000 }
 * - "Chaussure de sport Nike" -> { nom: "Chaussure de sport Nike", prix: null }
 */
export function parseAjoutProduitIntent(transcript: string): { nom: string; prix: number | null } {
  const montant = extraireMontantCFA(transcript)

  let nomClean = transcript.trim()

  // Supprimer les verbes ou mots d'amorce éventuels
  nomClean = nomClean.replace(/^(ajouter|mettre en vente|creer|créer|nouveau produit|produit|article)\s+/i, '')

  // Si un montant a été extrait, retirer la partie correspondant au prix à la fin ou dans le texte
  if (montant !== null) {
    // Retirer les nombres en chiffres purs
    nomClean = nomClean.replace(new RegExp(`\\b${montant}\\b`, 'g'), '')
    // Retirer les formats abrégés (ex: "25k", "25 mille")
    nomClean = nomClean.replace(/\b(\d+(?:[.,]\d+)?)\s*(?:k|mille|mil)\b/gi, '')
    // Retirer les devises wolof éventuelles
    nomClean = nomClean.replace(/\b(teemeer|téemeer|temeer|junni|djunni|cfa|fcfa|frs|francs)\b/gi, '')
    // Purge de tous les nombres (Français et Wolof, y compris avec caractères spéciaux ñ)
    const motsNombres = [
      'un', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix',
      'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'vingt', 'trente', 'quarante', 'cinquante', 'cent', 'mille', 'million',
      'benn', 'ben', 'benni',
      'naar', 'ñaar', 'niar', 'gnari', 'gnaar', 'naari', 'ñaari', 'niari',
      'nett', 'ñett', 'gnett', 'niett', 'netti', 'ñetti',
      'neent', 'ñeent', 'gneent', 'nient', 'neenti', 'ñeenti',
      'juroom', 'juróom', 'diourom', 'djourom', 'juroomi', 'juróomi',
      'fukk', 'fuk', 'fouk', 'fukki'
    ]
    const regexMots = new RegExp(`(?:^|\s+)(?:${motsNombres.join('|')})(?=\s+|$)`, 'gi')
    nomClean = nomClean.replace(regexMots, ' ')
    nomClean = nomClean.replace(regexMots, ' ')
  }

  // Nettoyer les espaces résiduels et la ponctuation
  nomClean = nomClean.replace(/\s+/g, ' ').replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, '').trim()

  // Si après extraction du prix le nom est devenu vide, garder la transcription originale
  if (!nomClean) {
    nomClean = transcript.trim()
  }

  // Première lettre en majuscule
  const nomFinal = nomClean.charAt(0).toUpperCase() + nomClean.slice(1)

  return {
    nom: nomFinal,
    prix: montant
  }
}

/**
 * Message d'aide pédagogique pour débloquer le microphone dans le navigateur
 */
export function getMessageErreurMicro(err: string): string {
  if (err === 'not-allowed' || err === 'PermissionDeniedError' || err === 'NotAllowedError') {
    return "Microphone bloqué par votre navigateur. Cliquez sur l'icône de cadenas (ou de réglages) à gauche de l'adresse du site (URL) -> Autorisez le Microphone, puis réessayez."
  }
  if (err === 'no-speech') {
    return "Aucune voix détectée. Veuillez parler plus près de votre micro."
  }
  if (err === 'network') {
    return "Erreur réseau. Vérifiez votre connexion Internet pour la reconnaissance vocale."
  }
  if (err === 'audio-capture') {
    return "Aucun microphone détecté sur cet appareil. Branchez un micro ou des écouteurs."
  }
  if (err === 'language-not-supported') return "La langue de reconnaissance n'est pas prise en charge par ce navigateur. Saisissez au clavier."
  if (err === 'aborted') return "L'écoute a été interrompue. Appuyez de nouveau sur le micro."
  if (err === 'service-not-allowed') return "Le service de reconnaissance vocale est bloqué sur cet appareil. Saisissez au clavier."
  if (err === 'NotFoundError') return "Aucun microphone détecté sur cet appareil. Branchez un micro ou des écouteurs."
  return "Le micro ne répond pas. Réessayez ou saisissez au clavier."
}

/**
 * Tente d'obtenir la permission du micro via getUserMedia (déclenche la demande native du navigateur si besoin)
 */
export async function demanderPermissionMicrophone(): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === 'undefined') return { ok: false, error: 'window-undefined' }

  // Si navigator.mediaDevices est indisponible (ex: HTTP au lieu de HTTPS), on prévient gentiment
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { ok: true }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    // Arrêter immédiatement les pistes audio
    stream.getTracks().forEach(track => track.stop())
    return { ok: true }
  } catch (err: any) {
    const errName = err?.name || err?.message || 'not-allowed'
    console.warn('[VOICE PERMISSION] getUserMedia refusal:', errName)
    return { ok: false, error: errName }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Gestionnaire d'écoute Web Speech API universel
// ─────────────────────────────────────────────────────────────────────────────

export interface VoiceListenerOptions {
  onResult: (transcript: string, alternatives?: string[]) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
  lang?: string
}

export function createVoiceListener({
  onResult,
  onError,
  onStart,
  onEnd,
  lang = 'fr-FR'
}: VoiceListenerOptions) {
  if (typeof window === 'undefined') return null

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) {
    return null
  }

  const recognition = new SpeechRecognition()
  recognition.continuous = false
  recognition.interimResults = false
  recognition.maxAlternatives = 5
  recognition.lang = lang

  recognition.onstart = () => {
    onStart?.()
  }

  recognition.onresult = (event: any) => {
    const alts: string[] = []
    if (event.results && event.results[0]) {
      for (let i = 0; i < event.results[0].length; i++) {
        const item = event.results[0][i]
        if (item && item.transcript) {
          alts.push(item.transcript.trim())
        }
      }
    }
    const transcript = alts[0] || ''
    onResult(transcript, alts)
  }

  recognition.onerror = (event: any) => {
    console.warn('[VOICE LISTENER] Erreur reco:', event.error)
    onError?.(event.error)
  }

  recognition.onend = () => {
    onEnd?.()
  }

  return recognition
}


// ─────────────────────────────────────────────────────────────────────────────
// Sama Xaalis : dettes et créances personnelles (AUD-198)
// Sémantique distincte du Carnet boutique : « me doit » = on me doit (a_recevoir), « je dois » = à payer (a_payer).
// ─────────────────────────────────────────────────────────────────────────────

export interface KalpeDetteIntent {
  /** null = sens non précisé (le formulaire garde son choix actuel) */
  sens: 'a_recevoir' | 'a_payer' | null
  /** « m'a remboursé » : à enregistrer comme règlement d'une créance existante, pas comme nouvelle dette */
  remboursement: boolean
  nomClient?: string
  tiersType: 'particulier' | 'entreprise'
  telephone?: string
  /** AAAA-MM-JJ */
  dateEcheance?: string
  montant: number | null
}

const JOURS_SEMAINE = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

function isoLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Échéance dictée (« demain », « avant vendredi », « dans 3 jours », « fin du mois ») → AAAA-MM-JJ. */
export function extraireEcheance(clean: string, aujourdhui: Date = new Date()): { date?: string; mots: string[] } {
  const base = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate())
  const ajout = (n: number) => { const d = new Date(base); d.setDate(d.getDate() + n); return isoLocal(d) }
  if (/\bapres demain\b/.test(clean)) return { date: ajout(2), mots: ['apres', 'demain'] }
  if (/\bdemain\b/.test(clean)) return { date: ajout(1), mots: ['demain'] }
  const dans = clean.match(/\bdans (\d{1,2}) (jour|jours|semaine|semaines)\b/)
  if (dans) return { date: ajout(parseInt(dans[1], 10) * (dans[2].startsWith('semaine') ? 7 : 1)), mots: dans[0].split(' ') }
  if (/\bfin (du|de) mois\b/.test(clean)) {
    return { date: isoLocal(new Date(base.getFullYear(), base.getMonth() + 1, 0)), mots: ['fin', 'du', 'de', 'mois'] }
  }
  for (let i = 0; i < 7; i++) {
    if (new RegExp(`\\b${JOURS_SEMAINE[i]}\\b`).test(clean)) {
      let delta = (i - base.getDay() + 7) % 7
      if (delta === 0) delta = 7
      return { date: ajout(delta), mots: [JOURS_SEMAINE[i], 'avant', 'pour', 'le'] }
    }
  }
  return { mots: [] }
}

const MOTS_VIDES_DETTE = new Set([
  'bonjour', 'bonsoir', 'salam', 'salut', 'allo', 'merci', 'stp', 'svp', 'je', 'j', 'ai', 'me', 'm', 'a', 'as', 'on', 'il', 'elle', 'mon', 'ma',
  'dois', 'doit', 'doivent', 'devoir', 'dette', 'dettes', 'creance', 'creances', 'credit', 'bor', 'bore', 'emprunte', 'empruntee', 'prete', 'pretee',
  'preter', 'avance', 'avancer', 'rembourse', 'rembourser', 'remboursement', 'paye', 'payer', 'verse', 'envers', 'pour', 'de', 'du', 'des', 'd',
  'le', 'la', 'les', 'l', 'au', 'aux', 'a', 'ak', 'et', 'un', 'une', 'avant', 'apres', 'demain', 'aujourdhui', 'dans', 'fin', 'mois', 'jours', 'jour',
  'semaine', 'semaines', 'francs', 'franc', 'fcfa', 'cfa', 'frs', 'f', 'euro', 'euros', 'noter', 'note', 'ajoute', 'ajouter', 'enregistre', 'client', 'monsieur', 'madame',
  ...JOURS_SEMAINE,
])

const MOTS_ENTREPRISE = /\b(ecole|college|lycee|universite|senelec|sde|sonatel|orange|free|expresso|societe|entreprise|banque|pressing|boutique|sarl|clinique|hopital|mairie|association|groupe|cabinet|agence|garage|restaurant|pharmacie|mosquee|gie|ong)\b/

/** Analyse une phrase dictée dans la modale « Dette / Créance » de Sama Xaalis. */
export function parseKalpeDetteIntent(transcript: string, alternatives: string[] = []): KalpeDetteIntent {
  const candidats = [transcript, ...alternatives.filter(a => a && a !== transcript)]
  let meilleur: KalpeDetteIntent | null = null
  for (const phrase of candidats) {
    const clean = normaliserTexteVocal(phrase)
    const brut = clean.replace(/(?:\+?221\s*)?(?:7[05678]|33)(?:\s*\d{3}\s*\d{2}\s*\d{2}|\s*\d{2}\s*\d{2}\s*\d{3}|\s*\d{7})\b/g, ' ')
    const tel = clean.match(/(?:\+?221\s*)?((?:7[05678]|33)(?:\s*\d{3}\s*\d{2}\s*\d{2}|\s*\d{2}\s*\d{2}\s*\d{3}|\s*\d{7}))\b/)
    const telephone = tel ? tel[1].replace(/\s+/g, '') : undefined

    const remboursement = /\b(m a rembourse|ma rembourse|m ont rembourse|rembourse moi|rembourse|a rembourse|ont rembourse|a solde)\b/.test(clean) && !/\bje (dois|rembourse)\b/.test(clean) && !/\bj ai rembourse\b/.test(clean)
    let sens: KalpeDetteIntent['sens'] = null
    if (/\b(je dois|je lui dois|j ai emprunte|j ai pris a credit|j ai une dette|dette envers|je doit)\b/.test(clean)) sens = 'a_payer'
    else if (/\b(me doit|me doivent|m a emprunte|m ont emprunte|j ai prete|on me doit|creance|doit me)\b/.test(clean) || remboursement) sens = 'a_recevoir'
    else if (/\bj ai rembourse\b/.test(clean)) sens = 'a_payer'

    const { date, mots: motsDate } = extraireEcheance(clean)
    const montant = extraireMontantCFA(brut)
    const tiersType: KalpeDetteIntent['tiersType'] = MOTS_ENTREPRISE.test(clean) ? 'entreprise' : 'particulier'

    // Nom : mots de la parole d'origine hors mots vides, nombres, date et téléphone
    const exclusDate = new Set(motsDate)
    const garde: string[] = []
    for (const b of phrase.replace(/[’']/g, ' ').split(/\s+/)) {
      const w = b.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
      if (!w) continue
      const n = sansAccents(w)
      if (/^\d/.test(n)) continue
      if (MOTS_VIDES_DETTE.has(n) || MOTS_NOMBRES_LIBELLE.has(n) || exclusDate.has(n)) continue
      garde.push(w.charAt(0).toUpperCase() + w.slice(1))
    }
    const nomClient = garde.length ? garde.join(' ') : undefined
    const intent: KalpeDetteIntent = { sens, remboursement, nomClient, tiersType, telephone, dateEcheance: date, montant }
    if (!meilleur) meilleur = intent
    if (montant || nomClient) return intent
  }
  return meilleur as KalpeDetteIntent
}

/**
 * AUD-200 : sépare le MONTANT de la QUANTITÉ. La quantité n'est cherchée que dans ce qui reste de la phrase
 * une fois les mots du montant retirés (« cinq mille francs » n'est jamais « 5 unités »).
 */
export function separerQuantiteEtMontant(texte: string): { quantite: number; montant: number | null; reste: string } {
  const clean = normaliserTexteVocal(texte)
  const { montants, reste } = analyserMontants(clean)
  const montant = montants.length ? Math.max(...montants) : null
  let quantite = 1
  const x = reste.match(/\bx\s*(\d{1,2})\b/)
  if (x) quantite = parseInt(x[1], 10)
  else {
    const tok = reste.split(/\s+/)
    for (let i = 0; i < tok.length; i++) {
      if (/^\d{1,2}$/.test(tok[i])) { quantite = parseInt(tok[i], 10); break }
      if (tok[i] in MOTS_UNITES && tok[i] !== 'et') {
        const run: string[] = []
        for (let j = i; j < tok.length && (tok[j] in MOTS_UNITES || tok[j] === 'et'); j++) run.push(tok[j])
        quantite = evaluerMotsNombres(run).valeur || 1
        break
      }
      const w = NOMBRES_MAPPING[tok[i]]
      if (w && /^[a-z]+$/.test(tok[i]) && w < 10) { quantite = w; break }
    }
  }
  return { quantite, montant, reste }
}