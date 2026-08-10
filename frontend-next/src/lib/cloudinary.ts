import { sanitizeImgUrl } from '@/components/ExternalImg'

/**
 * Transforme une URL Cloudinary pour y injecter des paramètres de qualité.
 * Les URLs d'autres CDN (Jumia, Expat-Dakar…) sont sanitizées en HTTPS.
 *
 * Exemple :
 *   res.cloudinary.com/abc/image/upload/v1/annonces/photo.jpg
 *   → https://res.cloudinary.com/abc/image/upload/q_90,f_auto,dpr_2.0/v1/annonces/photo.jpg
 */
export function cloudinaryHQ(
  url: string | null | undefined,
  opts: { width?: number; quality?: number } = {}
): string {
  const sanitized = sanitizeImgUrl(url)
  if (!sanitized) return ''
  if (!sanitized.includes('res.cloudinary.com')) return sanitized

  const { width, quality = 90 } = opts

  const transforms = [
    `q_${quality}`,
    'f_auto',
    'dpr_2.0',
    ...(width ? [`w_${width}`, 'c_limit'] : []),
  ].join(',')

  // Insère les transformations après /upload/
  return sanitized.replace('/upload/', `/upload/${transforms}/`)
}
