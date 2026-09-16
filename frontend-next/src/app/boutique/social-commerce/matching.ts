// frontend-next/src/app/boutique/social-commerce/matching.ts
// Moteur de Smart Matching v2 côté client pour suggestions et associations instantanées

import { ProduitCatalogue, ProductMatchSuggestion } from './types'

const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'l',
  'et', 'ou', 'a', 'au', 'aux', 'avec', 'sans', 'pour', 'dans', 'sur', 'en', 'par',
  'ce', 'cet', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'est', 'sont', 'disponible', 'disponibles', 'promo', 'promotion', 'solde', 'soldes',
  'prix', 'fcfa', 'cfa', 'dakar', 'senegal', 'sn', 'boutique', 'arrivage', 'nouveau',
  'nouvelle', 'collection', 'whatsapp', 'commande', 'commander', 'livraison'
])

export function normalizeClientText(str: string): string {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractClientPrices(text: string): number[] {
  if (!text) return []
  const found = new Set<number>()

  const currencyRegex = /(?:^|[^\w])(\d{1,3}(?:[\s.,]\d{3})+|\d+)\s*(k)?\s*(?:f(?:cfa)?|cfa|fcfa|xof)\b/gi
  let m: RegExpExecArray | null
  while ((m = currencyRegex.exec(text)) !== null) {
    const raw = m[1].replace(/[\s.,]/g, '')
    let num = parseInt(raw, 10)
    if (!isNaN(num) && num > 0) {
      if (m[2] && m[2].toLowerCase() === 'k') num *= 1000
      if (num >= 100 && num <= 50000000) found.add(num)
    }
  }

  const prefixRegex = /\b(?:prix|tarif|montant)\s*[:=]?\s*(\d{1,3}(?:[\s.,]\d{3})+|\d+)\s*(k)?\b/gi
  while ((m = prefixRegex.exec(text)) !== null) {
    const raw = m[1].replace(/[\s.,]/g, '')
    let num = parseInt(raw, 10)
    if (!isNaN(num) && num > 0) {
      if (m[2] && m[2].toLowerCase() === 'k') num *= 1000
      if (num >= 500 && num <= 50000000) found.add(num)
    }
  }

  return Array.from(found)
}

export function extractClientHashtags(text: string): string[] {
  if (!text) return []
  const hashtagRegex = /#([a-zA-Z0-9_\u00C0-\u017F]+)/g
  const tags = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = hashtagRegex.exec(text)) !== null) {
    const norm = normalizeClientText(m[1].replace(/_/g, ''))
    if (norm && norm.length > 1 && !STOP_WORDS.has(norm)) {
      tags.add(norm)
    }
  }
  return Array.from(tags)
}

export function matchProductsClient(caption: string, products: ProduitCatalogue[]): ProductMatchSuggestion[] {
  if (!caption || !products || products.length === 0) return []

  const normCaption = normalizeClientText(caption)
  if (!normCaption) return []

  const captionPrices = extractClientPrices(caption)
  const captionHashtags = extractClientHashtags(caption)
  const captionWords = normCaption.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w))

  if (captionWords.length === 0 && captionPrices.length === 0 && captionHashtags.length === 0) return []

  const matches: ProductMatchSuggestion[] = []

  for (const p of products) {
    const normNom = normalizeClientText(p.nom || '')
    const normCat = normalizeClientText(p.categorie || '')
    const pPrice = typeof p.prix === 'number' ? p.prix : Number(p.prix) || 0

    let score = 0
    let priceMatched = false
    let matchedPriceVal: number | null = null
    const matchedHashtags: string[] = []

    // 1. Nom complet exact
    if (normNom.length > 3 && normCaption.includes(normNom)) {
      score += 0.85
    } else {
      // 2. Mots clés du nom
      const nomWords = normNom.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w))
      let count = 0
      for (const w of nomWords) {
        if (normCaption.includes(w)) count++
      }
      if (nomWords.length > 0) {
        score += (count / nomWords.length) * 0.60
      }
    }

    // 3. Catégorie
    if (normCat && normCat.length > 2 && normCaption.includes(normCat)) {
      score += 0.15
    }

    // 4. Prix
    if (pPrice > 0 && captionPrices.length > 0) {
      for (const cp of captionPrices) {
        const diffRatio = Math.abs(pPrice - cp) / pPrice
        if (diffRatio <= 0.05) {
          score += 0.25
          priceMatched = true
          matchedPriceVal = cp
          break
        }
      }
    }

    // 5. Hashtags
    if (captionHashtags.length > 0) {
      for (const tag of captionHashtags) {
        if ((normNom && normNom.includes(tag)) || (normCat && normCat.includes(tag))) {
          matchedHashtags.push(tag)
        }
      }
      if (matchedHashtags.length > 0) {
        score += Math.min(0.20, matchedHashtags.length * 0.10)
      }
    }

    const finalScore = Math.min(1.0, Math.round(score * 100) / 100)

    if (finalScore >= 0.35) {
      let level: 'high' | 'medium' | 'low' = 'low'
      if (finalScore >= 0.75) level = 'high'
      else if (finalScore >= 0.50) level = 'medium'

      matches.push({
        produit: p,
        confidence_score: finalScore,
        confidence_level: level,
        suggested: true,
        price_matched: priceMatched,
        matched_price: matchedPriceVal,
        matched_hashtags: matchedHashtags,
      })
    }
  }

  return matches.sort((a, b) => b.confidence_score - a.confidence_score)
}
