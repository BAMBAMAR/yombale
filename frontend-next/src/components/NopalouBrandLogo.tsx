'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

export interface NopalouBrandLogoProps {
  /** Taille de l'icône carrée en pixels. Défaut : 28 */
  taille?: number
  /** Thème couleur du texte : 'light' (Navy / Orange) ou 'dark' (Blanc / Orange). Défaut : 'light' */
  theme?: 'light' | 'dark'
  /** Afficher ou masquer le texte wordmark "Nopalou". Défaut : true */
  afficherTexte?: boolean
  /** Taille de police du wordmark (calculée automatiquement si omise) */
  tailleTexte?: number
  /** Envelopper dans un lien vers la page d'accueil (/). Défaut : true */
  lienAccueil?: boolean
  /** Priorité de chargement Next.js pour LCP. Défaut : false */
  priority?: boolean
  /** Sous-titre ou badge optionnel sous le nom (ex: "Control Center") */
  sousTitre?: React.ReactNode
  /** Classe CSS additionnelle */
  className?: string
  /** Styles inline additionnels */
  style?: React.CSSProperties
  /** Accessibilité : texte de description du lien */
  ariaLabel?: string
  /** Gestionnaire de clic (ex: fermeture d'un menu déroulant) */
  onClick?: () => void
}

/**
 * Composant officiel et unique de la marque NOPALOU.
 * Sanctuarise l'emblème SVG officiel `/icons/logo-n.svg` (monogramme géométrique N
 * sur dégradé solaire 4-stop officiel) et la typographie bicolore Nopa (Navy/Blanc) + lou (Orange).
 */
export default function NopalouBrandLogo({
  taille = 28,
  theme = 'light',
  afficherTexte = true,
  tailleTexte,
  lienAccueil = true,
  priority = false,
  sousTitre,
  className = '',
  style,
  ariaLabel = 'Nopalou — Plateforme de commerce digital et comparateur au Sénégal',
  onClick,
}: NopalouBrandLogoProps) {
  const nopaColor = theme === 'dark' ? '#FFFFFF' : 'var(--navy, #1C2B4A)'
  const louColor = 'var(--accent, #C75B00)'
  const computedFontSize = tailleTexte || (taille >= 40 ? 24 : taille >= 30 ? 20 : taille >= 26 ? 18 : 16)

  const content = (
    <span
      className={`nopalou-brand-logo-content ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.max(6, Math.round(taille * 0.28)),
        userSelect: 'none',
        lineHeight: 1,
        ...style,
      }}
    >
      <Image
        src="/icons/logo-n.svg"
        alt="Nopalou"
        width={taille}
        height={taille}
        priority={priority}
        style={{
          width: taille,
          height: taille,
          flexShrink: 0,
          display: 'block',
        }}
      />

      {afficherTexte && (
        <span
          style={{
            display: 'inline-flex',
            flexDirection: sousTitre ? 'column' : 'row',
            alignItems: sousTitre ? 'flex-start' : 'baseline',
            gap: sousTitre ? 2 : 0,
            lineHeight: 1,
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-archivo, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
              fontSize: computedFontSize,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            <span style={{ color: nopaColor }}>Nopa</span>
            <span style={{ color: louColor }}>lou</span>
          </span>
          {sousTitre && (
            <span
              style={{
                fontSize: Math.max(10, Math.round(computedFontSize * 0.52)),
                fontWeight: 600,
                color: theme === 'dark' ? 'rgba(255,255,255,0.65)' : 'var(--text-muted, #64748B)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1,
                marginTop: 2,
              }}
            >
              {sousTitre}
            </span>
          )}
        </span>
      )}
    </span>
  )

  if (lienAccueil) {
    return (
      <Link
        href="/"
        onClick={onClick}
        aria-label={ariaLabel}
        title="Retour à l'accueil Nopalou"
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          color: 'inherit',
          ...style,
        }}
      >
        {content}
      </Link>
    )
  }

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
    >
      {content}
    </div>
  )
}
