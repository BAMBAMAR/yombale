'use client'

import React from 'react'
import { Shield, KeyRound } from 'lucide-react'

interface PosLockCaissierGridProps {
  caissiersActifs: any[]
  onSelectCaissier: (c: any) => void
  onOpenConfigPin: () => void
}

export default function PosLockCaissierGrid({
  caissiersActifs,
  onSelectCaissier,
  onOpenConfigPin,
}: PosLockCaissierGridProps) {
  return (
    <div>
      <h3 style={{ margin: '12px 0 4px', fontSize: 17, fontWeight: 900, color: 'var(--pos-navy, #0f172a)' }}>
        Qui encaisse aujourd&apos;hui ?
      </h3>
      <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--pos-text2, #64748b)' }}>
        Sélectionnez votre profil pour accéder à la caisse :
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
          marginBottom: 16,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {caissiersActifs.map((c: any) => {
          const isSuper = c.role === 'superviseur' || c.role === 'admin'
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCaissier(c)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 10px',
                borderRadius: 16,
                border: isSuper ? '2px solid #fed7aa' : '2px solid #bfdbfe',
                background: isSuper ? '#fffaf5' : '#f8faff',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: isSuper
                    ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 900,
                  marginBottom: 8,
                  boxShadow: isSuper ? '0 4px 10px rgba(234, 88, 12, 0.25)' : '0 4px 10px rgba(37, 99, 235, 0.25)',
                }}
              >
                {isSuper ? (
                  <Shield size={24} />
                ) : c.prenom ? (
                  c.prenom.charAt(0).toUpperCase()
                ) : c.nom ? (
                  c.nom.charAt(0).toUpperCase()
                ) : (
                  ''
                )}
              </div>

              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: 'var(--pos-navy, #0f172a)',
                  marginBottom: 4,
                  textAlign: 'center',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {c.prenom ? `${c.prenom} ${c.nom || ''}`.trim() : c.nom}
              </span>

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: isSuper ? '#fff7ed' : '#eff6ff',
                  color: isSuper ? '#c2410c' : '#1d4ed8',
                  border: isSuper ? '1px solid #fed7aa' : '1px solid #bfdbfe',
                }}
              >
                {isSuper ? 'Superviseur' : 'Caissier'}
              </span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={onOpenConfigPin}
        style={{
          marginTop: 4,
          background: 'none',
          border: 'none',
          color: 'var(--pos-primary, #ea580c)',
          fontSize: 12.5,
          fontWeight: 800,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
        }}
      >
        <KeyRound size={14} />
        <span>Gérant : Gérer l&apos;équipe & modifier les codes PIN</span>
      </button>
    </div>
  )
}
