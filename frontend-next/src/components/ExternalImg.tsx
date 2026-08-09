'use client'

import { useState, useEffect } from 'react'

interface ExternalImgProps {
  src: string | null | undefined
  alt: string
  fallback?: string | React.ReactNode
  className?: string
  fallbackClassName?: string
  style?: React.CSSProperties
  loading?: 'lazy' | 'eager'
  width?: number
  height?: number
  onMouseEnter?: (e: React.MouseEvent<HTMLImageElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLImageElement>) => void
}

/**
 * Nettoie et sécurise l'URL d'image.
 */
export function sanitizeImgUrl(url: string | null | undefined): string | null {
  if (!url) return null
  let cleaned = String(url).trim()
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

  // 4. Force HTTPS pour éviter les blocages de contenu mixte et échecs CSP upgrade-insecure-requests
  if (cleaned.startsWith('http://')) {
    return cleaned.replace(/^http:\/\//i, 'https://')
  }

  // 5. Si l'URL ne commence ni par https:// ni par / ni par data:/blob: mais contient un domaine (ex: res.cloudinary.com/..., images.coinafrique.com/...)
  if (
    !cleaned.startsWith('https://') &&
    !cleaned.startsWith('/') &&
    !cleaned.startsWith('data:') &&
    !cleaned.startsWith('blob:')
  ) {
    if (
      cleaned.includes('/') ||
      cleaned.includes('.com') ||
      cleaned.includes('.sn') ||
      cleaned.includes('.net') ||
      cleaned.includes('.org')
    ) {
      return 'https://' + cleaned
    }
  }

  return cleaned
}

/**
 * Balise img native robuste :
 * - referrerPolicy="no-referrer" pour éviter les blocages anti-hotlink des CDN (CoinAfrique, Jumia, etc.)
 * - Tentative automatique via le proxy CDN sécurisé (wsrv.nl) si le chargement direct échoue
 * - Affichage de l'élément de secours (emoji/icône) uniquement en dernier recours
 */
export default function ExternalImg({
  src,
  alt,
  fallback = '📦',
  className,
  fallbackClassName,
  style,
  loading = 'lazy',
  width,
  height,
  onMouseEnter,
  onMouseLeave,
}: ExternalImgProps) {
  const cleanSrc = sanitizeImgUrl(src)
  const [attempt, setAttempt] = useState<number>(0) // 0 = direct, 1 = proxy (wsrv.nl), 2 = fallback

  useEffect(() => {
    setAttempt(0)
  }, [cleanSrc])

  if (!cleanSrc || attempt >= 2) {
    if (typeof fallback === 'string') {
      return (
        <span
          className={fallbackClassName}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, ...style }}
          aria-label={alt}
        >
          {fallback}
        </span>
      )
    }
    return <>{fallback}</>
  }

  const currentSrc = attempt === 1
    ? `https://wsrv.nl/?url=${encodeURIComponent(cleanSrc)}`
    : cleanSrc

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      width={width}
      height={height}
      referrerPolicy={attempt === 0 ? "no-referrer" : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onError={() => {
        setAttempt(prev => prev + 1)
      }}
    />
  )
}

