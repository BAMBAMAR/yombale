// frontend-next/src/app/agence/[slug]/social/matching-immo-client.ts
// Moteur de Smart Matching immobilier côté client adapté depuis le Social Shop universel

import { BienItem } from './types'

export interface BienMatchSuggestion {
  bien: BienItem
  confidence_score: number
  confidence_level: 'high' | 'medium' | 'low'
  suggested: boolean
  price_matched: boolean
  matched_price: number | null
  matched_keywords: string[]
}

const STOP_WORDS_IMMO = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l',
  'et', 'ou', 'a', 'au', 'aux', 'avec', 'sans', 'pour', 'dans', 'sur', 'en', 'par',
  'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'son', 'sa', 'ses',
  'est', 'sont', 'disponible', 'disponibles', 'promo', 'visite', 'opportunite',
  'prix', 'fcfa', 'cfa', 'dakar', 'senegal', 'sn', 'agence', 'contact', 'whatsapp',
  'mois', 'par', 'vente', 'location', 'urgent', 'offre', 'exclusive'
])

export function normalizeImmoText(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractImmoPrices(text: string): number[] {
  if (!text) return []
  const found = new Set<number>()

  // Ex: "350 000 FCFA", "150000f", "85 000 000 CFA"
  const currencyRegex = /(?:^|[^\w])(\d{1,3}(?:[\s.,]\d{3})+|\d+)\s*(k|m)?\s*(?:f(?:cfa)?|cfa|fcfa|xof)\b/gi
  let m: RegExpExecArray | null
  while ((m = currencyRegex.exec(text)) !== null) {
    const raw = m[1].replace(/[\s.,]/g, '')
    let num = parseInt(raw, 10)
    if (!isNaN(num) && num > 0) {
      const suffix = m[2]?.toLowerCase()
      if (suffix === 'k') num *= 1000
      if (suffix === 'm') num *= 1000000
      if (num >= 10000 && num <= 5000000000) found.add(num)
    }
  }

  // Format abrégé millions : "85M", "120 millions"
  const millionsRegex = /\b(\d+(?:[.,]\d+)?)\s*(?:m|millions?)\b/gi
  while ((m = millionsRegex.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(',', '.'))
    if (!isNaN(val) && val > 0) {
      const num = Math.round(val * 1000000)
      if (num >= 1000000 && num <= 5000000000) found.add(num)
    }
  }

  // Format "prix: 450 000"
  const prefixRegex = /\b(?:loyer|prix|tarif|montant)\s*[:=]?\s*(\d{1,3}(?:[\s.,]\d{3})+|\d+)\s*(k|m)?\b/gi
  while ((m = prefixRegex.exec(text)) !== null) {
    const raw = m[1].replace(/[\s.,]/g, '')
    let num = parseInt(raw, 10)
    if (!isNaN(num) && num > 0) {
      const suffix = m[2]?.toLowerCase()
      if (suffix === 'k') num *= 1000
      if (suffix === 'm') num *= 1000000
      if (num >= 20000 && num <= 5000000000) found.add(num)
    }
  }

  return Array.from(found)
}

export function matchBiensClient(caption: string, biens: BienItem[]): BienMatchSuggestion[] {
  if (!caption || !biens || biens.length === 0) return []

  const normCaption = normalizeImmoText(caption)
  if (!normCaption) return []

  const captionPrices = extractImmoPrices(caption)
  const captionWords = normCaption.split(' ').filter(w => w.length > 2 && !STOP_WORDS_IMMO.has(w))

  const matches: BienMatchSuggestion[] = []

  for (const b of biens) {
    const normTitre = normalizeImmoText(b.titre || '')
    const normQuartier = normalizeImmoText(b.quartier || '')
    const normType = normalizeImmoText(b.type_bien || '')
    const prix = b.prix_location || b.prix_vente || 0

    let score = 0
    let priceMatched = false
    let matchedPriceVal: number | null = null
    const matchedKeywords: string[] = []

    // 1. Titre exact ou inclusion majeure
    if (normTitre.length > 4 && normCaption.includes(normTitre)) {
      score += 0.80
      matchedKeywords.push(b.titre)
    } else {
      const titreWords = normTitre.split(' ').filter(w => w.length > 2 && !STOP_WORDS_IMMO.has(w))
      let count = 0
      for (const w of titreWords) {
        if (normCaption.includes(w)) {
          count++
          matchedKeywords.push(w)
        }
      }
      if (titreWords.length > 0) {
        score += (count / titreWords.length) * 0.50
      }
    }

    // 2. Quartier / Localisation (très fort signal en immobilier !)
    if (b.quartier && normQuartier && normQuartier.length > 2 && normCaption.includes(normQuartier)) {
      score += 0.30
      matchedKeywords.push(b.quartier)
    }

    // 3. Type de bien (villa, appartement, studio, terrain)
    if (b.type_bien && normType && normType.length > 2 && normCaption.includes(normType)) {
      score += 0.15
      matchedKeywords.push(b.type_bien)
    }

    // 4. Prix
    if (prix > 0 && captionPrices.length > 0) {
      for (const cp of captionPrices) {
        const diffRatio = Math.abs(prix - cp) / prix
        if (diffRatio <= 0.05) {
          score += 0.30
          priceMatched = true
          matchedPriceVal = cp
          break
        }
      }
    }

    const finalScore = Math.min(1.0, Math.round(score * 100) / 100)

    if (finalScore >= 0.35) {
      let level: 'high' | 'medium' | 'low' = 'low'
      if (finalScore >= 0.75) level = 'high'
      else if (finalScore >= 0.50) level = 'medium'

      matches.push({
        bien: b,
        confidence_score: finalScore,
        confidence_level: level,
        suggested: true,
        price_matched: priceMatched,
        matched_price: matchedPriceVal,
        matched_keywords: Array.from(new Set(matchedKeywords)),
      })
    }
  }

  return matches.sort((a, b) => b.confidence_score - a.confidence_score)
}
