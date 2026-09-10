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
 * Exemples Dépenses :
 * - "Dépense transport 2500" / "Dépenses transport 2500" -> depense, transport, 2500
 * - "Dépens benn téemeer essence" -> depense, transport, 500
 * - "Essence 2000" / "Transport 1500" / "Loyer 50000" -> depense automatique
 * - "Senelec 10000" / "Woyofal 5000" / "Repas midi 2000" -> depense automatique
 * - Si l'utilisateur est déjà sur l'onglet Dépense (modeActuel === 'depense'), toute dictée reste une dépense sauf mot Vente explicite.
 *
 * Exemples Ventes :
 * - "Vente café Touba 500" -> vente, 500, libellé "Café Touba"
 * - "Vente 10 000" / "Jaay 5000" -> vente
 */
export function parseSaisieExpressIntent(transcript: string, modeActuel?: 'vente' | 'depense'): SaisieExpressIntent {
  const clean = normaliserTexteVocal(transcript)
  const montant = extraireMontantCFA(clean)

  // 1. Détection explicite des mots-clés de Dépense (singulier, pluriel, wolof, variantes)
  const hasMotCleDepense = /\b(depense|depenses|depans|depanse|depanser|depanseur|charge|charges|sortie|sorties|payer|paiement|paiements|facture|factures|frais|perte|pertes|decaissement|decaissements)\b/i.test(clean)

  // 2. Détection des catégories typiquement Dépenses même sans le mot "dépense"
  const isTransport = /\b(transport|transports|essence|carburant|gasoil|gazoil|diesel|taxi|taxis|tiak|tiaktiak|clando|peage|autoroute)\b/i.test(clean)
  const isLoyer = /\b(loyer|loyers|magasin|bail|locataire)\b/i.test(clean)
  const isFourniture = /\b(fourniture|fournitures|sachet|sachets|emballage|emballages|carton|cartons|papier|papiers|scotch|etiquette|etiquettes)\b/i.test(clean)
  const isSalaire = /\b(salaire|salaires|employe|employes|personnel|gardien|commission|commissions|avance salaire)\b/i.test(clean)
  const isTaxes = /\b(taxe|taxes|impot|impots|patente|mairie|douane|fiscalite)\b/i.test(clean)
  const isChargesCourantes = /\b(woyofal|senelec|sde|sen eau|seneau|electricite|eau|sonatel|orange|wifi|forfait|credit telephone|repas|dejeuner|diner|manger|thieb|ndekki|nourriture|recharge)\b/i.test(clean)
  const isAchatStock = /\b(achat stock|achat fournisseur|achat marchandise|approvisionnement|reappro)\b/i.test(clean)

  // 3. Détection explicite de Vente (singulier, pluriel, wolof)
  const hasMotCleVente = /\b(vente|ventes|jaay|jaaye|jaayi|vendre|vendu|vendus|encaissement|recette|recettes)\b/i.test(clean)

  // Détermination du mode :
  // - Si mot-clé explicite dépense OU catégorie typique de dépense -> DÉPENSE
  // - Si mot-clé explicite de vente (ex: "Vente...") -> VENTE
  // - Si aucun mot-clé explicite, respecter le mode sélectionné par l'utilisateur (onglet Dépense vs Vente)
  let isDepense = false
  if (hasMotCleDepense || isTransport || isLoyer || isFourniture || isSalaire || isTaxes || isChargesCourantes || isAchatStock) {
    isDepense = true
  } else if (hasMotCleVente) {
    isDepense = false
  } else if (modeActuel === 'depense') {
    isDepense = true
  } else {
    isDepense = false
  }

  if (isDepense) {
    let cat: SaisieExpressIntent['categorie'] = 'autre'
    let descDefaut = 'Dépense'

    if (isTransport) {
      cat = 'transport'
      descDefaut = 'Frais de transport'
    } else if (isLoyer) {
      cat = 'loyer'
      descDefaut = 'Paiement loyer'
    } else if (isAchatStock || /\b(stock|marchandise|fournisseur|achat|colis)\b/i.test(clean)) {
      cat = 'stock'
      descDefaut = 'Achat de stock'
    } else if (isSalaire) {
      cat = 'salaires'
      descDefaut = 'Salaires / Équipe'
    } else if (/\b(marketing|pub|publicite|sponsor|flyer|flyers)\b/i.test(clean)) {
      cat = 'marketing'
      descDefaut = 'Marketing / Publicité'
    } else if (isFourniture) {
      cat = 'fournitures'
      descDefaut = 'Fournitures / Emballages'
    } else if (isTaxes) {
      cat = 'taxes'
      descDefaut = 'Taxes / Impôts'
    }

    // Extraire une description propre à partir des mots dictés
    let descClean = clean
      .replace(/\b(depense|depenses|depans|depanse|depanser|pour|de|du|des|le|la|les|un|une)\b/gi, '')
      .replace(/\b(\d{2,7})\b/g, '')
      .replace(/\b(teemeer|téemeer|temeer|junni|djunni|cfa|fcfa|frs|francs)\b/gi, '')
      .replace(/\b(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|quinze|vingt|trente|quarante|cinquante|cent|mille|benn|naar|ñaar|nett|ñett|juroom|fukk)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()

    let descFinale = descClean ? descClean.charAt(0).toUpperCase() + descClean.slice(1) : descDefaut

    return {
      mode: 'depense',
      montant: montant || 0,
      categorie: cat,
      description: descFinale
    }
  }

  // Intention Vente
  let libelle = clean
    .replace(/\b(vente|ventes|jaay|jaaye|jaayi|encaisser|vendre|ajouter|pour|de|du|des)\b/gi, '')
    .replace(/\b(\d{2,7})\b/g, '')
    .replace(/\b(teemeer|téemeer|temeer|junni|djunni|cfa|fcfa|frs|francs)\b/gi, '')
    .replace(/\b(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|quinze|vingt|trente|quarante|cinquante|cent|mille|benn|naar|ñaar|nett|ñett|juroom|fukk)\b/gi, '')
    .replace(/\s+/g, ' ')
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

  const isRemboursement = /\b(remboursement|rembourser|rembourse|fey|feyna|feye|payer|paye|payé|payee|a paye|a payé|versement|verser|verse|versé|regler|regle|reglé|rendu|rendre)\b/i.test(clean)
  const isCredit = /\b(dette|dettes|credit|credits|bor|bore|keredit|doit|doivent|doive|preter|avancer)\b/i.test(clean)

  // 1. Chercher d'abord parmi les clients connus (recherche exacte puis par prénom)
  let clientTrouve: string | undefined

  for (const cNom of listeClientsConnus) {
    const cClean = normaliserTexteVocal(cNom)
    if (clean.includes(cClean)) {
      clientTrouve = cNom
      break
    }
  }

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

  // 2. Si le client n'est pas dans la liste des clients connus, extraire le nom à partir des mots restants
  if (!clientTrouve) {
    const matchApresMotCle = clean.match(/\b(?:dette|dettes|credit|credits|bor|bore|remboursement|fey|feyna)\s+(?:de\s+|bu\s+)?([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\b/i)
    if (matchApresMotCle && matchApresMotCle[1]) {
      const candidat = matchApresMotCle[1].trim()
      const premierMot = candidat.split(/\s+/)[0]
      if (!NOMBRES_MAPPING[premierMot] && !DEVISES_WOLOF[premierMot] && premierMot !== 'cfa' && premierMot !== 'fcfa') {
        clientTrouve = candidat.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }
    }

    if (!clientTrouve) {
      // Nettoyer tous les mots-clés d'actions, montants, chiffres
      const sansMotsCles = clean
        .replace(/\b(dette|dettes|credit|credits|bor|bore|keredit|doit|doivent|doive|preter|avancer|remboursement|rembourser|rembourse|fey|feyna|payer|paye|payé|versement|verser|regler|cherche|trouve|voir|client|pour|de|du|des|le|la|bu|ci|ak)\b/gi, ' ')
        .replace(/\b(\d{1,8})\b/g, ' ')
        .replace(/\b(teemeer|téemeer|temeer|junni|djunni|cfa|fcfa|frs|francs|f)\b/gi, ' ')
        .replace(/\b(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|quinze|vingt|trente|quarante|cinquante|cent|mille|million|benn|naar|ñaar|nett|ñett|juroom|fukk)\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (sansMotsCles && sansMotsCles.length >= 2) {
        clientTrouve = sansMotsCles
          .split(/\s+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      }
    }
  }

  // 3. Déterminer l'intention finale
  if (isRemboursement) {
    return {
      type: 'remboursement',
      nomClient: clientTrouve,
      montant: montant || null
    }
  }

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

