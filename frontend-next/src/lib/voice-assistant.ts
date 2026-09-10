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
 * Nettoie et normalise une chaîne transcrite (minuscules, sans accents, sans ponctuation excessive).
 */
export function normaliserTexteVocal(texte: string): string {
  let res = texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Fusionner les milliers écrits avec un espace (ex: "10 000" -> "10000", "5 000" -> "5000")
  res = res.replace(/\b(\d+)\s+(\d{3})\b/g, '$1$2')
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

/**
 * Extrait un montant financier en Francs CFA à partir d'un texte mixte Wolof / Français.
 * Gère les syntaxes :
 * - "benn téemeer" -> 500
 * - "ñaari junni" -> 10 000
 * - "fukki junni" -> 50 000
 * - "10 000", "2500", "50000"
 * - "cinq mille" -> 5000
 */
export function extraireMontantCFA(cleanText: string): number | null {
  const clean = normaliserTexteVocal(cleanText)

  // 1. Détection des devises Wolof (téemeer, junni) avec multiplicateur
  for (const [motW, baseVal] of Object.entries(DEVISES_WOLOF)) {
    if (clean.includes(motW)) {
      // Trouver le mot précédent pour le multiplicateur
      const mots = clean.split(/\s+/)
      const idx = mots.indexOf(motW)
      let mult = 1
      if (idx > 0) {
        const motAvant = mots[idx - 1]
        if (NOMBRES_MAPPING[motAvant]) {
          mult = NOMBRES_MAPPING[motAvant]
        }
      }
      return mult * baseVal
    }
  }

  // 2. Détection de nombres directs écrits en chiffres (ex: 2500, 10000, 50000)
  const regexChiffres = /\b(\d{2,7})\b/g
  const matches = clean.match(regexChiffres)
  if (matches && matches.length > 0) {
    // Prendre le plus grand nombre si plusieurs (généralement le montant)
    const nombres = matches.map(n => parseInt(n, 10))
    return Math.max(...nombres)
  }

  // 3. Détection de nombres composés écrits en lettres (ex: "dix mille", "deux mille")
  if (clean.includes('mille')) {
    const mots = clean.split(/\s+/)
    const idx = mots.indexOf('mille')
    let mult = 1
    if (idx > 0) {
      const avant = mots[idx - 1]
      if (NOMBRES_MAPPING[avant]) mult = NOMBRES_MAPPING[avant]
    }
    return mult * 1000
  }

  // 4. Détection de nombres simples (ex: "cent", "deux cents")
  if (clean.includes('cent')) {
    const mots = clean.split(/\s+/)
    const idx = mots.indexOf('cent')
    let mult = 1
    if (idx > 0) {
      const avant = mots[idx - 1]
      if (NOMBRES_MAPPING[avant]) mult = NOMBRES_MAPPING[avant]
    }
    return mult * 100
  }

  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Parsers spécialisés par section de Nopalou
// ─────────────────────────────────────────────────────────────────────────────

export interface SaisieExpressIntent {
  mode: 'depense' | 'vente'
  montant: number | null
  categorie?: 'loyer' | 'stock' | 'transport' | 'salaires' | 'marketing' | 'fournitures' | 'taxes' | 'autre'
  description?: string
  libelleProduit?: string
}

/**
 * Parse vocal pour la Saisie Express Comptable :
 * Exemples :
 * - "Dépense transport 2500" -> depense, transport, 2500
 * - "Dépense essence benn téemeer" -> depense, transport, 500
 * - "Dépense loyer cinquante mille" -> depense, loyer, 50000
 * - "Vente café Touba 500" -> vente, 500, libellé "café Touba"
 * - "Vente 10 000" -> vente, 10000
 */
export function parseSaisieExpressIntent(transcript: string): SaisieExpressIntent {
  const clean = normaliserTexteVocal(transcript)
  const montant = extraireMontantCFA(clean)

  // Détection intention Dépense
  const isDepense = /\b(depense|depenser|charge|sortie|payer|facture|frais)\b/.test(clean)

  if (isDepense) {
    let cat: SaisieExpressIntent['categorie'] = 'autre'
    let desc = 'Dépense vocale'

    if (/\b(transport|essence|taxi|tiak|clando|car|gasoil)\b/.test(clean)) {
      cat = 'transport'
      desc = 'Frais de transport'
    } else if (/\b(loyer|boutique|magasin|bail)\b/.test(clean)) {
      cat = 'loyer'
      desc = 'Paiement loyer'
    } else if (/\b(stock|marchandise|fournisseur|achat|colis|produits)\b/.test(clean)) {
      cat = 'stock'
      desc = 'Achat de stock'
    } else if (/\b(salaire|salaires|employe|personnel|commission)\b/.test(clean)) {
      cat = 'salaires'
      desc = 'Salaires / Équipe'
    } else if (/\b(marketing|pub|publicite|sponsor|flyer)\b/.test(clean)) {
      cat = 'marketing'
      desc = 'Marketing / Publicité'
    } else if (/\b(fourniture|fournitures|sachet|emballage|papier)\b/.test(clean)) {
      cat = 'fournitures'
      desc = 'Fournitures / Emballages'
    } else if (/\b(taxe|impot|patente|mairie)\b/.test(clean)) {
      cat = 'taxes'
      desc = 'Taxes / Impôts'
    }

    return {
      mode: 'depense',
      montant: montant || 0,
      categorie: cat,
      description: desc
    }
  }

  // Sinon intention Vente
  // Nettoyer les mots déclencheurs pour trouver le libellé du produit s'il y en a un
  let libelle = clean
    .replace(/\b(vente|jaay|encaisser|vendre|ajouter)\b/g, '')
    .replace(/\b(\d{2,7})\b/g, '')
    .replace(/\b(teemeer|téemeer|temeer|junni|djunni)\b/g, '')
    .trim()

  return {
    mode: 'vente',
    montant: montant || 0,
    libelleProduit: libelle ? libelle.charAt(0).toUpperCase() + libelle.slice(1) : undefined
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
export function parseDetteIntent(transcript: string, listeClientsConnus: string[] = []): DetteIntent {
  const clean = normaliserTexteVocal(transcript)
  const montant = extraireMontantCFA(clean)

  const isRemboursement = /\b(remboursement|rembourser|fey|payer|versement|regler)\b/.test(clean)
  const isCredit = /\b(dette|credit|bor|keredit|preter|avancer)\b/.test(clean)

  // Chercher si un nom de client connu est présent
  let clientTrouve: string | undefined
  for (const cNom of listeClientsConnus) {
    const cClean = normaliserTexteVocal(cNom)
    if (clean.includes(cClean)) {
      clientTrouve = cNom
      break
    }
  }

  // Si pas dans la liste, extraire le mot après "dette / bor / remboursement"
  if (!clientTrouve) {
    const match = clean.match(/\b(?:dette|credit|bor|remboursement|fey)\s+(?:de\s+|bu\s+)?([a-zA-Z]+)\b/)
    if (match && match[1]) {
      const mot = match[1]
      // S'assurer que ce n'est pas un chiffre
      if (!NOMBRES_MAPPING[mot] && !DEVISES_WOLOF[mot]) {
        clientTrouve = mot.charAt(0).toUpperCase() + mot.slice(1)
      }
    }
  }

  if (isRemboursement) {
    return {
      type: 'remboursement',
      nomClient: clientTrouve,
      montant: montant || null
    }
  }

  if (isCredit) {
    return {
      type: 'vente_credit',
      nomClient: clientTrouve,
      montant: montant || null
    }
  }

  if (clientTrouve) {
    return {
      type: 'recherche',
      nomClient: clientTrouve,
      montant: null
    }
  }

  // Par défaut, simple recherche d'un client par son prénom/nom
  const nomIsole = clean
    .replace(/\b(cherche|trouve|voir|client)\b/g, '')
    .trim()

  const nomFormate = nomIsole
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  return {
    type: 'recherche',
    nomClient: nomFormate || undefined,
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
  nomClean = nomClean.replace(/^(ajouter|mettre en vente|creer|nouveau produit|produit|article)\s+/i, '')

  // Si un montant a été extrait, retirer la partie correspondant au prix à la fin ou dans le texte
  if (montant !== null) {
    // Retirer les nombres en chiffres purs
    nomClean = nomClean.replace(new RegExp(`\\b${montant}\\b`, 'g'), '')
    // Retirer les devises wolof éventuelles
    nomClean = nomClean.replace(/\b(teemeer|téemeer|temeer|junni|djunni|cfa|fcfa|frs|francs)\b/gi, '')
    // Retirer les mots de prix écrits en lettres (ex: "quinze mille", "dix mille", "deux mille", "mille")
    nomClean = nomClean.replace(/\b(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|quinze|vingt|trente|quarante|cinquante|cent|mille|benn|naar|ñaar|nett|ñett|juroom|fukk)\b/gi, '')
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
    return "Microphone bloqué par votre navigateur. Cliquez sur l'icône de cadenas 🔒 (ou de réglages) à gauche de l'adresse du site (URL) -> Autorisez le Microphone, puis réessayez."
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
  return `Micro indisponible (${err}). Réessayez ou vérifiez les autorisations de votre navigateur.`
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
  onResult: (transcript: string) => void
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
  recognition.lang = lang

  recognition.onstart = () => {
    onStart?.()
  }

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript.trim()
    onResult(transcript)
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

