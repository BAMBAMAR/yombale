'use client'

import { useState, useEffect } from 'react'
import { sanitizeImgUrl, optimizeCloudinaryImgUrl } from '@/lib/sanitizeImg'

export { sanitizeImgUrl, optimizeCloudinaryImgUrl }

export interface ExternalImgProps {
  src: string | null | undefined
  alt: string
  fallback?: string | React.ReactNode
  className?: string
  fallbackClassName?: string
  style?: React.CSSProperties
  loading?: 'lazy' | 'eager'
  width?: number
  height?: number
  watermark?: boolean
  onMouseEnter?: (e: React.MouseEvent<HTMLImageElement>) => void
  onMouseLeave?: (e: React.MouseEvent<HTMLImageElement>) => void
}

/**
 * Balise img native robuste & ultra-optimisée :
 * - Chargement direct et sécurisé en HTTPS
 * - Optimisation automatique Cloudinary (WebP/AVIF, f_auto, q_auto, dimensionnement)
 * - Fallback via proxy CDN (wsrv.nl) si échec direct
 * - Affichage de l'élément de secours en dernier recours
 * - Tatouage numérique / Watermark anti-vol de marque (optionnel)
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
  watermark = false,
  onMouseEnter,
  onMouseLeave,
}: ExternalImgProps) {
  const targetWidth = width ? Math.min(width * 2, 1000) : 500
  const cleanSrc = optimizeCloudinaryImgUrl(src, targetWidth) || sanitizeImgUrl(src)
  const [attempt, setAttempt] = useState<number>(0) // 0 = direct/optimisé, 1 = proxy (wsrv.nl), 2 = fallback

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

  const imageElement = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      referrerPolicy="no-referrer"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onContextMenu={watermark ? (e) => e.preventDefault() : undefined}
      onError={() => {
        setAttempt(prev => prev + 1)
      }}
    />
  )

  if (watermark) {
    return (
      <div style={{ position: 'relative', display: 'block', width: '100%', height: '100%', overflow: 'hidden' }}>
        {imageElement}
        <span
          style={{
            position: 'absolute',
            bottom: 6,
            right: 6,
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.9)',
            background: 'rgba(0, 0, 0, 0.55)',
            padding: '2px 7px',
            borderRadius: 4,
            backdropFilter: 'blur(3px)',
            letterSpacing: '0.4px',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 3,
          }}
        >
          nopalou.com
        </span>
      </div>
    )
  }

  return imageElement
}


