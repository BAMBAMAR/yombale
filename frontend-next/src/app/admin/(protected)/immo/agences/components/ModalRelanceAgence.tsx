'use client'

import React, { useState } from 'react'
import {
  MessageSquare,
  X,
  Copy,
  Check,
  Send,
  Building2,
  Phone,
  ExternalLink,
} from 'lucide-react'
import { showToast } from '@/context/ToastContext'
import { AgenceImmo, genererMessageGuideAgence } from './types'

interface ModalRelanceAgenceProps {
  agences: AgenceImmo[]
  onClose: () => void
  onFinished?: () => void
}

export default function ModalRelanceAgence({
  agences,
  onClose,
  onFinished,
}: ModalRelanceAgenceProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const isMultiple = agences.length > 1
  const [activeAgenceIndex, setActiveAgenceIndex] = useState<number>(0)

  const currentAgence = agences[activeAgenceIndex] || agences[0]
  const messagePreview = currentAgence ? genererMessageGuideAgence(currentAgence) : ''

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    showToast('Message copié dans le presse-papier !', 'success', 'Guide Agence WhatsApp')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const getWaLink = (agence: AgenceImmo) => {
    const tel = agence.whatsapp || agence.telephone || ''
    const cleanPhone = tel.replace(/\D/g, '')
    if (!cleanPhone) return null
    const formatted = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`
    return `https://wa.me/${formatted}?text=${encodeURIComponent(genererMessageGuideAgence(agence))}`
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          width: '100%',
          maxWidth: 620,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        {/* En-tête */}
        <div
          style={{
            background: 'var(--accent, #C75B00)',
            color: '#ffffff',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MessageSquare size={22} />
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                {isMultiple
                  ? `Relance WhatsApp (${agences.length} agences ciblées)`
                  : `Relance Agence : ${currentAgence?.nom || ''}`}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.9 }}>
                Guide d&apos;onboarding, publication de biens et baux locatifs OHADA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 22, maxHeight: '80vh', overflowY: 'auto' }}>
          {isMultiple && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
                Choisir l&apos;agence à prévisualiser :
              </label>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 6 }}>
                {agences.map((ag, idx) => (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => setActiveAgenceIndex(idx)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      border: activeAgenceIndex === idx ? '1px solid var(--accent, #C75B00)' : '1px solid #cbd5e1',
                      background: activeAgenceIndex === idx ? '#ffedd5' : '#f8fafc',
                      color: activeAgenceIndex === idx ? '#9a3412' : '#475569',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ag.nom} ({ag.nb_biens || 0} biens)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fiche Contact Agence */}
          {currentAgence && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--border, #E8DDD2)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>
                  {currentAgence.nom}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {currentAgence.proprietaire_nom || 'Responsable'} ·{' '}
                  {currentAgence.telephone || currentAgence.whatsapp || 'Sans numéro'} ·{' '}
                  {currentAgence.ville || 'Dakar'}
                </div>
              </div>

              {getWaLink(currentAgence) && (
                <a
                  href={getWaLink(currentAgence)!}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: '#25D366',
                    color: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(37,211,102,0.2)',
                  }}
                >
                  <Send size={13} />
                  <span>Ouvrir WhatsApp</span>
                </a>
              )}
            </div>
          )}

          {/* Aperçu du message WhatsApp */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
                Message WhatsApp pré-formaté :
              </label>
              <button
                type="button"
                onClick={() => handleCopy(messagePreview, activeAgenceIndex)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copiedIndex === activeAgenceIndex ? '#059669' : 'var(--accent, #C75B00)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copiedIndex === activeAgenceIndex ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedIndex === activeAgenceIndex ? 'Copié !' : 'Copier le message'}</span>
              </button>
            </div>

            <textarea
              readOnly
              value={messagePreview}
              rows={12}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 8,
                border: '1px solid var(--border, #E8DDD2)',
                fontSize: 12,
                lineHeight: 1.5,
                background: '#ffffff',
                fontFamily: 'monospace',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Actions de bas de modale */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fermer
            </button>
            {currentAgence && getWaLink(currentAgence) && (
              <a
                href={getWaLink(currentAgence)!}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#25D366',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Send size={14} />
                <span>Envoyer sur WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
