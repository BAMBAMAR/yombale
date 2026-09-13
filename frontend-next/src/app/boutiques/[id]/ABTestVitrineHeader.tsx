'use client'

import { useState, useEffect } from 'react'

interface ABTestVitrineHeaderProps {
  boutiqueId: string
  nomInitial: string
  sloganInitial?: string | null
  planActif?: 'pro' | 'business' | null
  couleurTheme?: string | null
  categorie?: string | null
  adresse?: string | null
  ville?: string | null
}

export default function ABTestVitrineHeader({
  boutiqueId,
  nomInitial,
  sloganInitial,
  planActif,
  couleurTheme,
  categorie,
  adresse,
  ville,
}: ABTestVitrineHeaderProps) {
  const [titre, setTitre] = useState(nomInitial)
  const [slogan, setSlogan] = useState<string | null>(sloganInitial ?? null)

  useEffect(() => {
    if (!boutiqueId || typeof window === 'undefined') return

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.nopalou.com'
    const storageKey = `nopalou_ab_${boutiqueId}`

    // 1. Vérifier si un variant a déjà été attribué dans cette session
    try {
      const cached = sessionStorage.getItem(storageKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.titre) setTitre(parsed.titre)
        if (parsed?.slogan !== undefined) setSlogan(parsed.slogan)
        return
      }
    } catch {
      // Ignorer l'erreur sessionStorage
    }

    // 2. Récupérer le split A/B actif depuis l'API publique
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/ab-test`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.active && data.testId) {
          const resolvedTitre = data.titre || nomInitial
          const resolvedSlogan = data.slogan !== undefined ? data.slogan : sloganInitial

          setTitre(resolvedTitre)
          setSlogan(resolvedSlogan)

          // Persister le variant pour la session de navigation
          try {
            sessionStorage.setItem(
              storageKey,
              JSON.stringify({
                testId: data.testId,
                variant: data.variant,
                titre: resolvedTitre,
                slogan: resolvedSlogan,
              })
            )
          } catch {
            // Ignorer
          }

          // Enregistrer l'impression A/B
          fetch(`${backendUrl}/api/boutiques/${boutiqueId}/ab-test/event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testId: data.testId,
              variant: data.variant,
              eventType: 'impression',
            }),
          }).catch(() => {})
        }
      })
      .catch(() => {
        // En cas d'erreur réseau, conserver les valeurs initiales sans blocage
      })
  }, [boutiqueId, nomInitial, sloganInitial])

  return (
    <div style={{ flex: 1, minWidth: 0, paddingBottom: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 'clamp(18px, 4vw, 22px)', fontWeight: 800, margin: 0, color: '#0f172a' }}>
          {titre}
        </h1>
        {planActif === 'business' && (
          <span style={{ fontSize: 11, background: 'var(--navy, #1C2B4A)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
            Business
          </span>
        )}
        {planActif === 'pro' && (
          <span style={{ fontSize: 11, background: couleurTheme || 'var(--accent, #C75B00)', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
            Vendeur Pro
          </span>
        )}
      </div>

      {slogan && (
        <p style={{ margin: '3px 0 0', fontSize: 13.5, color: '#1E293B', fontWeight: 700, fontStyle: 'italic' }}>
          « {slogan} »
        </p>
      )}

      <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {[categorie, adresse, ville].filter(Boolean).join(' · ')}
      </p>
    </div>
  )
}
