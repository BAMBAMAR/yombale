'use client'

import React from 'react'
import Link from 'next/link'
import { Lock, ArrowLeft } from 'lucide-react'

interface PosNonAutoriseScreenProps {
  boutiques: Array<{
    id: string
    nom: string
    is_trial?: boolean
    plan_actif?: string | null
  }>
  activeBoutiqueNom?: string | null
  boutiqueActiveId?: string | null
  initialToken?: string | null
  onChangerBoutique: (id: string) => void
}

export default function PosNonAutoriseScreen({
  boutiques,
  activeBoutiqueNom = 'Sélectionnée',
  boutiqueActiveId,
  initialToken,
  onChangerBoutique,
}: PosNonAutoriseScreenProps) {
  const boutiquesAutorisees = boutiques.filter(
    b => b.is_trial || b.plan_actif === 'pro' || b.plan_actif === 'business'
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #F8F5F0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: 580,
          width: '100%',
          background: 'var(--card, #ffffff)',
          borderRadius: 'var(--r-xl, 16px)',
          padding: '40px 32px',
          boxShadow: 'var(--shadow-lg, 0 8px 24px rgba(26,22,18,.12))',
          border: '1px solid var(--border, #E8DDD2)',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#fff7ed',
            border: '2px solid #ffedd5',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent, #C75B00)',
            marginBottom: 20
          }}
        >
          <Lock size={36} />
        </div>

        <div
          style={{
            display: 'inline-block',
            background: '#fff7ed',
            color: 'var(--accent, #C75B00)',
            fontWeight: 800,
            fontSize: 11,
            padding: '4px 12px',
            borderRadius: 'var(--r-pill, 9999px)',
            marginBottom: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Caisse POS Non Autorisée Pour Cette Boutique
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--navy, #1C2B4A)', margin: '0 0 12px' }}>
          La boutique &quot;{activeBoutiqueNom}&quot; n&apos;a pas d&apos;Abonnement POS
        </h1>

        <p style={{ fontSize: 14, color: 'var(--text2, #5A4E42)', lineHeight: 1.6, margin: '0 0 24px' }}>
          L&apos;accès à la caisse enregistreuse tactile POS est réservé aux boutiques disposant d&apos;un abonnement{' '}
          <strong>Pro</strong> ou <strong>Business</strong> actif.
        </p>

        {boutiquesAutorisees.length > 0 && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--r-lg, 12px)',
              padding: 16,
              marginBottom: 24,
              textAlign: 'left'
            }}
          >
            <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--price, #0A5C36)', display: 'block', marginBottom: 6 }}>
              Basculer vers une boutique autorisée :
            </label>
            <select
              value=""
              onChange={e => onChangerBoutique(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 'var(--r-md, 8px)',
                border: '1px solid #86efac',
                background: '#ffffff',
                color: 'var(--navy, #1C2B4A)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              <option value="">-- Sélectionner une boutique avec caisse autorisée --</option>
              {boutiquesAutorisees.map(b => (
                <option key={b.id} value={b.id}>
                  {b.nom} ({b.plan_actif?.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {initialToken ? (
            <div
              style={{
                padding: '14px 18px',
                background: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: 'var(--r-lg, 12px)',
                color: '#c2410c',
                fontSize: 13,
                fontWeight: 700,
                lineHeight: 1.5
              }}
            >
              La caisse enregistreuse de cette boutique nécessite l&apos;activation d&apos;un abonnement Pro ou Business auprès du gérant/propriétaire. Veuillez contacter l&apos;administrateur du magasin.
            </div>
          ) : (
            <>
              <Link
                href="/boutique/abonnement"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: 'var(--r-lg, 12px)',
                  background: 'linear-gradient(135deg, var(--accent, #c75b00) 0%, #ea580c 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(199, 91, 0, 0.25)'
                }}
              >
                Activer l&apos;Abonnement Pro (5 000 FCFA/mois) &rarr;
              </Link>
              <Link
                href={boutiqueActiveId ? `/boutique?manage=${boutiqueActiveId}` : '/boutique'}
                className="annonce-back"
                style={{
                  margin: '0 auto',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text2, #5A4E42)',
                  fontSize: 13,
                  fontWeight: 700
                }}
              >
                <ArrowLeft size={14} />
                <span>Retour au tableau de bord boutique</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
