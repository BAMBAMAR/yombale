import { sanitizeImgUrl, optimizeCloudinaryImgUrl } from '@/lib/sanitizeImg'

export { optimizeCloudinaryImgUrl }

/**
 * Transforme une URL Cloudinary pour y injecter des paramètres de format et qualité optimaux.
 * Les URLs d'autres CDN (Jumia, Expat-Dakar…) sont sanitizées en HTTPS.
 *
 * Exemple :
 *   res.cloudinary.com/abc/image/upload/v1/annonces/photo.jpg
 *   → https://res.cloudinary.com/abc/image/upload/f_auto,q_auto,w_600,c_limit/v1/annonces/photo.jpg
 */
export function cloudinaryHQ(
  url: string | null | undefined,
  opts: { width?: number; quality?: number | string } = {}
): string {
  const sanitized = sanitizeImgUrl(url)
  if (!sanitized) return ''
  if (!sanitized.includes('res.cloudinary.com')) return sanitized

  const { width = 600, quality = 'auto' } = opts
  return optimizeCloudinaryImgUrl(sanitized, width) || sanitized
}

