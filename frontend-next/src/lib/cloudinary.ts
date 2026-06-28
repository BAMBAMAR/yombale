/**
 * Transforme une URL Cloudinary pour y injecter des paramètres de qualité.
 * Les URLs d'autres CDN (Jumia, Expat-Dakar…) sont retournées telles quelles.
 *
 * Exemple :
 *   https://res.cloudinary.com/abc/image/upload/v1/annonces/photo.jpg
 *   → https://res.cloudinary.com/abc/image/upload/q_90,f_auto,dpr_2.0/v1/annonces/photo.jpg
 */
export function cloudinaryHQ(
  url: string | null | undefined,
  opts: { width?: number; quality?: number } = {}
): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com')) return url

  const { width, quality = 90 } = opts

  const transforms = [
    `q_${quality}`,
    'f_auto',
    'dpr_2.0',
    ...(width ? [`w_${width}`, 'c_limit'] : []),
  ].join(',')

  // Insère les transformations après /upload/
  return url.replace('/upload/', `/upload/${transforms}/`)
}
