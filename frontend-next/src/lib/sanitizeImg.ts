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
