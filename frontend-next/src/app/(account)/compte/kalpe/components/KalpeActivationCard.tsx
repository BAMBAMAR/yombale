'use client'

import { useState } from 'react'
import { Sparkles, ShieldCheck, Mic, MessageSquare, Target, ArrowRight } from 'lucide-react'
import { activerKalpe } from '../actions'
import { useToast } from '@/context/ToastContext'

interface KalpeActivationCardProps {
  onActivated: () => void
}

export function KalpeActivationCard({ onActivated }: KalpeActivationCardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleActiver = async () => {
    setLoading(true)
    try {
      const res = await activerKalpe()
      if (res.success) {
        toast.success(res.message || 'Sama Xaalis activé avec succès ! Bienvenue.')
        onActivated()
      } else {
        toast.error(res.error || 'Erreur lors de l’activation')
      }
    } catch {
      toast.error('Erreur réseau lors de l’activation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
        borderRadius: '16px',
        padding: '24px 20px',
        color: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(28, 43, 74, 0.15)',
        margin: '12px 0 24px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: 'rgba(199, 91, 0, 0.25)',
            border: '1px solid rgba(199, 91, 0, 0.4)',
            color: '#FFA86A',
            padding: '4px 10px',
            borderRadius: '999px',
          }}
        >
          <Sparkles size={13} />
          Nouveau module Nopalou
        </span>
      </div>

      <h2
        style={{
          fontSize: '20px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: '0 0 6px 0',
          color: '#FFFFFF',
        }}
      >
        Sama Xaalis
      </h2>
      <p
        style={{
          fontSize: '13px',
          color: '#C8D4E5',
          margin: '0 0 18px 0',
          lineHeight: '1.45',
        }}
      >
        Mon argent. Ma gestion. Ma tranquillité. Suivez vos entrées, vos dépenses et vos crédits en toute discrétion, avec ou sans boutique.
      </p>

      {/* 4 Avantages clés */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '10px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Mic size={15} color="#FFA86A" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Dictée bilingue</div>
            <div style={{ fontSize: '11px', color: '#B5C4DA', lineHeight: '1.3' }}>Wolof & Français (téemeer, junni...)</div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={15} color="#4ADE80" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Relances WhatsApp</div>
            <div style={{ fontSize: '11px', color: '#B5C4DA', lineHeight: '1.3' }}>Lien Wave direct en 1 clic</div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Target size={15} color="#38BDF8" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>Objectifs d'Épargne</div>
            <div style={{ fontSize: '11px', color: '#B5C4DA', lineHeight: '1.3' }}>Projets & cagnottes protégés</div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.07)',
            borderRadius: '10px',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={15} color="#A78BFA" />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>100% Confidentiel</div>
            <div style={{ fontSize: '11px', color: '#B5C4DA', lineHeight: '1.3' }}>Personnel vs Activité séparés</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '12px', color: '#D2DFEF' }}>
          <strong>Essai 30 jours inclus</strong> · Sans engagement
        </div>
        <button
          onClick={handleActiver}
          disabled={loading}
          style={{
            background: '#C75B00',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '11px 20px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(199, 91, 0, 0.35)',
            transition: 'background 0.15s ease',
          }}
        >
          {loading ? 'Activation en cours...' : 'Activer Sama Xaalis gratuitement'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
