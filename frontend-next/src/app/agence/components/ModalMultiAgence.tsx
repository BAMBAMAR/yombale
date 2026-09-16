'use client'

import React from 'react'
import { Building2, X, Sparkles, Zap, MessageSquare } from 'lucide-react'

interface ModalMultiAgenceProps {
  isOpen: boolean
  onClose: () => void
  tarifMensuel: number
  labelOption?: string
  currentAgencesCount: number
}

export function ModalMultiAgence({
  isOpen,
  onClose,
  tarifMensuel = 15000,
  labelOption = 'Option Réseau Multi-Agences',
  currentAgencesCount = 1,
}: ModalMultiAgenceProps) {
  if (!isOpen) return null

  const whatsappSupportUrl = `https://wa.me/221777202086?text=${encodeURIComponent(
    `Bonjour Nopalou, je possède déjà ${currentAgencesCount} agence(s) immobilière(s) et je souhaite activer l'${labelOption} (${tarifMensuel.toLocaleString('fr-FR')} FCFA/mois) pour créer une agence supplémentaire.`
  )}`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 16,
          maxWidth: 520,
          width: '100%',
          padding: 26,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            right: 16,
            top: 16,
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1C2B4A 0%, #2A3F6D 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              {labelOption}
            </h2>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Quota atteint : {currentAgencesCount} / 1 agence gratuite (Plan Essentiel)
            </span>
          </div>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: '#F8FAFC',
            border: '1px solid var(--border, #E8DDD2)',
            marginBottom: 18,
          }}
        >
          <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.55, margin: 0 }}>
            Votre compte bénéficie de <strong>1 agence gratuite incluse</strong>. Pour créer une seconde agence, développer une franchise ou gérer un réseau multi-villes, activez l'Option Réseau Multi-Agences.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 18 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {tarifMensuel.toLocaleString('fr-FR')} FCFA
          </span>
          <span style={{ fontSize: 13, color: '#64748B' }}>/ mois (sans engagement)</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
          {[
            'Création et gestion d\'agences multiples ou filiales régionales',
            'Équipes indépendantes et directeurs d\'agences dédiés',
            'Comptabilités, mandats et trésoreries séparés',
            'Support prioritaire Nopalou Pro & onboarding personnalisé',
          ].map((adv, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#475569' }}>
              <div style={{ color: 'var(--accent, #C75B00)' }}>
                <Sparkles size={15} />
              </div>
              <span>{adv}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={whatsappSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-npl"
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 18px',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 14,
              background: 'var(--accent, #C75B00)',
              color: '#FFFFFF',
              textDecoration: 'none',
            }}
          >
            <Zap size={16} />
            <span>Activer l'Option Multi-Agences</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="agence-btn-outline"
            style={{ padding: '12px 18px' }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
