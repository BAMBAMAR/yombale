'use client'

import React from 'react'

export default function SurgaBriefingSkeleton() {
  return (
    <div
      className="surga-card"
      style={{
        borderLeft: '4px solid var(--surga-accent, #D97706)',
        marginBottom: 16,
      }}
      aria-label="Chargement du briefing..."
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div
          style={{
            width: 140,
            height: 18,
            borderRadius: 6,
            background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
            backgroundSize: '200% 100%',
            animation: 'surgaShimmer 1.5s infinite',
          }}
        />
        <div
          style={{
            width: 70,
            height: 14,
            borderRadius: 4,
            background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
            backgroundSize: '200% 100%',
            animation: 'surgaShimmer 1.5s infinite',
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <div
          style={{
            width: '100%',
            height: 14,
            borderRadius: 4,
            background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
            backgroundSize: '200% 100%',
            animation: 'surgaShimmer 1.5s infinite',
          }}
        />
        <div
          style={{
            width: '85%',
            height: 14,
            borderRadius: 4,
            background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
            backgroundSize: '200% 100%',
            animation: 'surgaShimmer 1.5s infinite',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div
          style={{
            flex: 1,
            height: 38,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
            backgroundSize: '200% 100%',
            animation: 'surgaShimmer 1.5s infinite',
          }}
        />
        <div
          style={{
            width: 90,
            height: 38,
            borderRadius: 8,
            background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
            backgroundSize: '200% 100%',
            animation: 'surgaShimmer 1.5s infinite',
          }}
        />
      </div>
    </div>
  )
}
