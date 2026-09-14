import React from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, X } from 'lucide-react'
import { DemoExplanation } from './types'

interface DemoHeaderProps {
  labelPro: string
  activeExplanation: DemoExplanation | null
  onCloseExplanation: () => void
}

export default function DemoHeader({
  labelPro,
  activeExplanation,
  onCloseExplanation
}: DemoHeaderProps) {
  return (
    <>
      {/* Breadcrumb & Navigation Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            href="/"
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#FFFFFF',
              color: 'var(--text1)',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={15} />
            <span>Accueil Nopalou</span>
          </Link>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--navy)' }}>
              Démo Commerciale Interactive Nopalou
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
              Simulateur dynamique synchronisé en temps réel avec les tarifs et paramètres du site.
            </div>
          </div>
        </div>

        {/* SIMULATED ACCOUNT BAR */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: 'var(--shadow)'
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--text1)' }}>
            <span style={{ color: 'var(--text2)' }}>Compte démo :</span> <strong>Boutique Touba Express</strong>{' '}
            <span style={{ color: '#059669', fontSize: 11 }}>({labelPro})</span>
          </div>
          <a
            href="/brochure-apporteur.pdf"
            target="_blank"
            download
            style={{
              background: '#ECFDF5',
              color: '#059669',
              padding: '6px 12px',
              borderRadius: 20,
              fontWeight: 800,
              fontSize: 12,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <FileText size={13} />
            <span>Brochure PDF (13 p.)</span>
          </a>
        </div>
      </div>

      {/* EXPLANATION POPUP BANNER IF ACTIVE */}
      {activeExplanation && (
        <div
          style={{
            background: '#EFF6FF',
            border: '1.5px solid #3B82F6',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            position: 'relative',
            boxShadow: 'var(--shadow)'
          }}
        >
          <button
            onClick={onCloseExplanation}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              background: 'transparent',
              border: 'none',
              color: '#1E40AF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4
            }}
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#1E3A8A' }}>
            {activeExplanation.title}
          </div>
          <div style={{ fontSize: 13, color: '#1E40AF' }}>
            <strong>Explication :</strong> {activeExplanation.desc}
          </div>
          <div style={{ fontSize: 12, color: '#1E40AF' }}>
            <strong>Système :</strong> {activeExplanation.backend}
          </div>
          <div style={{ fontSize: 12, color: '#047857', fontWeight: 700 }}>
            <strong>Bénéfice :</strong> {activeExplanation.benefit}
          </div>
        </div>
      )}
    </>
  )
}
