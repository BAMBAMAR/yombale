'use client'

import React, { useState } from 'react'
import { HelpCircle, CreditCard, Coins, MessageCircle, Mic, ChevronDown, ChevronUp } from 'lucide-react'

interface CarnetGuidePedagogiqueProps {
  isMobile: boolean
}

export default function CarnetGuidePedagogique({ isMobile }: CarnetGuidePedagogiqueProps) {
  const [showGuideCarnet, setShowGuideCarnet] = useState(false)

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1.5px solid #e2e8f0',
        borderRadius: 14,
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <div
        onClick={() => setShowGuideCarnet(!showGuideCarnet)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={18} color="#0284c7" />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
            Comment fonctionne le Carnet de Dettes &amp; Crédits ?
          </span>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#0284c7',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {showGuideCarnet ? (
            <>
              <ChevronUp size={14} />
              <span>Masquer</span>
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              <span>Comprendre en 30 secondes</span>
            </>
          )}
        </span>
      </div>

      {showGuideCarnet && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 12,
            paddingTop: 8,
            borderTop: '1px solid #e2e8f0',
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: 10, padding: 12, border: '1px solid #fed7aa' }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: '#c2410c',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CreditCard size={14} />
              <span>1. Donner à crédit (Bor)</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
              Cliquez sur <strong>+ Vente crédit</strong>. Le client prend des articles sans payer : son solde
              devient rouge (<strong>« Doit X FCFA »</strong>).
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, padding: 12, border: '1px solid #bbf7d0' }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: '#15803d',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Coins size={14} />
              <span>2. Rembourser (Fey bor)</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
              Quand le client vient verser de l&apos;argent, cliquez sur <strong>Encaisser / Rembourser</strong>. Sa
              dette diminue jusqu&apos;à <strong>0 FCFA (À jour)</strong>.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, padding: 12, border: '1px solid #bae6fd' }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: '#0369a1',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <MessageCircle size={14} />
              <span>3. Avance ou Relance WhatsApp</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
              S&apos;il verse une provision, son solde devient vert (<strong>« Avance »</strong>). En 1 clic sur
              l&apos;icône WhatsApp, envoyez un rappel poli avec le solde exact.
            </p>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 10, padding: 12, border: '1px solid #fde047' }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 13,
                color: '#854d0e',
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Mic size={14} />
              <span>4. Mode Vocal (Wolof / FR)</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.4 }}>
              Dites <em>« Bor Moussa 10 000 »</em> pour une dette ou <em>« Moussa feyna 5000 »</em> pour un
              remboursement. Une carte s&apos;affiche pour valider en 1 clic !
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
