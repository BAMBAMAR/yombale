'use client'

import { useState } from 'react'

interface ExternalImgProps {
  src: string | null | undefined
  alt: string
  fallback?: string
  className?: string
  style?: React.CSSProperties
  loading?: 'lazy' | 'eager'
  width?: number
  height?: number
}

/**
 * Balise img native avec fallback emoji quand l'URL externe est cassée (Jumia, Expat-Dakar…).
 * Préférer ce composant à next/image pour les URLs non-Cloudinary dont on ne maîtrise pas la disponibilité.
 */
export default function ExternalImg({
  src,
  alt,
  fallback = '📦',
  className,
  style,
  loading = 'lazy',
  width,
  height,
}: ExternalImgProps) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return (
      <span
        className={className}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, ...style }}
        aria-label={alt}
      >
        {fallback}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      width={width}
      height={height}
      onError={() => setBroken(true)}
    />
  )
}
