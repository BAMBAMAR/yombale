'use client'

import React from 'react'

interface SurgaBrandLogoProps {
  taille?: number
  afficherTexte?: boolean
  onClick?: () => void
  classeNom?: string
}

/**
 * Composant officiel et unique du logo Surga.
 * Sanctuarise l'emblème officiel `/surga/surga-symbol.png` (personnage en caftan stylisé en S).
 * INTERDICTION ABSOLUE de remplacer par un div "S" ou une icône générique.
 */
export default function SurgaBrandLogo({
  taille = 34,
  afficherTexte = true,
  onClick,
  classeNom = '',
}: SurgaBrandLogoProps) {
  return (
    <div
      className={`surga-brand-logo ${classeNom}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <div
        className="surga-header-logo-wrap"
        title="Surga — Assistant de poche"
        aria-hidden="true"
        style={{
          width: taille,
          height: taille,
          flexShrink: 0,
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--surga-primary, #0F172A)',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
        }}
      >
        <img
          src="/surga/surga-symbol.png"
          alt="Surga"
          width={taille}
          height={taille}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
      </div>

      {afficherTexte && (
        <div
          style={{
            fontSize: taille > 30 ? 19 : 17,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: 'var(--surga-primary, #0F172A)',
            lineHeight: 1,
          }}
        >
          SUR<span style={{ color: 'var(--surga-accent-ink, #A64B08)' }}>GA</span>
        </div>
      )}
    </div>
  )
}
