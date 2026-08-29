/**
 * Nettoie et sécurise l'URL d'image pour garantir un protocole HTTPS absolu.
 * Fichier utilitaire pur (isomorphe Serveur / Client sans directive 'use client').
 */
export function sanitizeImgUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const cleaned = String(url).trim()
  if (!cleaned) return null

  // 1. Corrige les préfixes corrompus (ex: "https://domain.comdata:image/svg+xml,...")
  if (cleaned.includes('data:image/')) {
    const idx = cleaned.indexOf('data:image/')
    return cleaned.substring(idx)
  }

  // 2. Corrige les URLs relatives CoinAfrique (ex: "thumb_5904736...", "uploaded_...")
  if (cleaned.startsWith('thumb_') || cleaned.startsWith('uploaded_') || cleaned.startsWith('image_')) {
    return 'https://images.coinafrique.com/' + cleaned
  }

  // 3. Corrige les URLs relatives par protocole ("//domain.com/...")
  if (cleaned.startsWith('//')) {
    return 'https:' + cleaned
  }

  // 4. Force HTTPS pour éviter les blocages de contenu mixte
  if (cleaned.startsWith('http://')) {
    return cleaned.replace(/^http:\/\//i, 'https://')
  }

  // 5. URLs absolues avec https://, data:, blob:
  if (cleaned.startsWith('https://') || cleaned.startsWith('data:') || cleaned.startsWith('blob:')) {
    return cleaned
  }

  // 6. Fichiers statiques locaux de l'application Next.js (ex: /icons/..., /logo.svg)
  if (cleaned.startsWith('/')) {
    return cleaned
  }

  // 7. Domaine sans protocole (ex: res.cloudinary.com/..., images.coinafrique.com/..., www.soumari.com/..., electroniccorp.sn/..., etc.)
  return 'https://' + cleaned.replace(/^(https?:\/\/)?/i, '')
}

/**
 * Optimise automatiquement les URLs Cloudinary pour la vitesse de chargement et le SEO.
 * Convertit les lourdes photos de smartphone (2-4 Mo) en WebP/AVIF ultra-légers (20-40 Ko).
 */
export function optimizeCloudinaryImgUrl(
  url: string | null | undefined,
  targetWidth: number = 500
): string | null {
  const sanitized = sanitizeImgUrl(url)
  if (!sanitized) return null
  if (!sanitized.includes('res.cloudinary.com')) return sanitized

  // Si l'URL a déjà des paramètres de transformation Cloudinary (ex: /upload/q_auto,.../), on ne duplique pas
  if (sanitized.includes('/upload/')) {
    const uploadIndex = sanitized.indexOf('/upload/')
    const afterUpload = sanitized.substring(uploadIndex + 8)
    // Vérifie si une transformation commence directement après /upload/ (ex: w_..., f_..., q_..., c_...)
    if (/^(?:[a-z]_[a-z0-9_.:]+,?)+\//i.test(afterUpload)) {
      return sanitized
    }
    const widthParam = targetWidth > 0 ? `w_${Math.min(targetWidth, 1200)},` : ''
    const transforms = `f_auto,q_auto,${widthParam}c_limit`
    return sanitized.replace('/upload/', `/upload/${transforms}/`)
  }

  return sanitized
}

