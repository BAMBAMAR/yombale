'use client'

import React from 'react'
import {
  FileText,
  XCircle,
  Home,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Edit2,
  PenTool,
  FileCheck,
} from 'lucide-react'
import { getImmoAuthToken } from '@/lib/immo-auth'
import { BailItem } from './TableBauxImmo'

interface BailCardMobileProps {
  slug: string
  bail: BailItem
  onEditer?: (bail: BailItem) => void
  onResilier: (bail: BailItem) => void
  onSigner?: (bail: BailItem) => void
  onPieces?: (bail: BailItem) => void
  isSelected?: boolean
  onToggleSelect?: (bailId: string) => void
}

export function BailCardMobile({
  slug,
  bail,
  onEditer,
  onResilier,
  onSigner,
  onPieces,
  isSelected = false,
  onToggleSelect,
}: BailCardMobileProps) {
  const token = getImmoAuthToken()
  const isActif = bail.statut === 'actif'
  const telNet = (bail.locataire_tel || '').replace(/[^0-9]/g, '')
  const nomComplet = `${bail.locataire_nom} ${bail.locataire_prenom || ''}`.trim()
  const bailPdfUrl = `/api/agences/agence/${slug}/documents/bail/${bail.id}.pdf${
    token ? `?token=${encodeURIComponent(token)}` : ''
  }`

  const hasSigneLoc = Boolean(bail.signature_locataire)
  const hasSigneBailleur = Boolean(bail.signature_bailleur)
  const nbPieces = bail.pieces_jointes?.length || 0

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: isSelected ? '2px solid var(--accent, #C75B00)' : '1px solid var(--border, #E8DDD2)',
        boxShadow: isSelected ? '0 4px 12px rgba(199, 91, 0, 0.1)' : '0 2px 8px rgba(28, 43, 74, 0.04)',
        padding: 14,
        marginBottom: 12,
      }}
    >
      {/* Ligne d'en-tête : Checkbox + Bien + Statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(bail.id)}
              className="immo-checkbox"
            />
          )}
          <Home size={15} color="var(--accent, #C75B00)" />
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>
            {bail.bien_titre}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              background: isActif ? '#DCFCE7' : '#F1F5F9',
              color: isActif ? '#166534' : '#64748B',
              flexShrink: 0,
            }}
          >
            {isActif ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {isActif ? 'Actif' : bail.statut === 'resilie' ? 'Résilié' : bail.statut}
          </span>

          {hasSigneLoc && hasSigneBailleur ? (
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '1px 6px', borderRadius: 4 }}>
              Signé 2/2
            </span>
          ) : hasSigneLoc ? (
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#1E40AF', background: '#DBEAFE', padding: '1px 6px', borderRadius: 4 }}>
              Signé locataire
            </span>
          ) : hasSigneBailleur ? (
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#4338CA', background: '#E0E7FF', padding: '1px 6px', borderRadius: 4 }}>
              Signé agence
            </span>
          ) : (
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#92400E', background: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>
              Non signé
            </span>
          )}
        </div>
      </div>

      {/* Locataire & Contact */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
          <User size={14} color="#64748B" />
          <span style={{ fontWeight: 650 }}>{nomComplet}</span>
        </div>
        {telNet && (
          <a
            href={`tel:${telNet}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              color: 'var(--navy, #1C2B4A)',
              textDecoration: 'none',
              padding: '3px 8px',
              borderRadius: 6,
              background: '#F1F5F9',
            }}
          >
            <Phone size={12} />
            <span>{bail.locataire_tel}</span>
          </a>
        )}
      </div>

      {/* Montants & Période */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          background: '#FAF8F5',
          borderRadius: 8,
          padding: '8px 10px',
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Loyer mensuel</div>
          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
            {Number(bail.loyer_mensuel).toLocaleString('fr-FR')} FCFA
          </div>
          {bail.charges > 0 && (
            <div style={{ fontSize: 10.5, color: '#64748B' }}>
              + {Number(bail.charges).toLocaleString('fr-FR')} FCFA ch.
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Période</div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--navy, #1C2B4A)' }}>
            Du {new Date(bail.date_debut).toLocaleDateString('fr-FR')}
          </div>
          {bail.date_fin && (
            <div style={{ fontSize: 10.5, color: '#64748B' }}>
              au {new Date(bail.date_fin).toLocaleDateString('fr-FR')}
            </div>
          )}
        </div>
      </div>

      {/* Actions Tactiles */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {/* Dossier pièces */}
        {onPieces && (
          <button
            type="button"
            onClick={() => onPieces(bail)}
            style={{
              flex: '1 1 auto',
              minHeight: 38,
              padding: '0 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              borderRadius: 8,
              background: '#FAF8F5',
              border: '1px solid var(--border, #E8DDD2)',
              color: 'var(--navy, #1C2B4A)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <FileCheck size={13} style={{ color: 'var(--accent, #C75B00)' }} />
            <span>Pièces ({nbPieces})</span>
          </button>
        )}

        {/* Signer agence */}
        {isActif && !hasSigneBailleur && onSigner && (
          <button
            type="button"
            onClick={() => onSigner(bail)}
            style={{
              flex: '1 1 auto',
              minHeight: 38,
              padding: '0 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              borderRadius: 8,
              background: 'var(--accent, #C75B00)',
              border: 'none',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <PenTool size={13} />
            <span>Signer</span>
          </button>
        )}

        <a
          href={bailPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: '1 1 auto',
            minHeight: 38,
            padding: '0 8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            borderRadius: 8,
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            color: 'var(--navy, #1C2B4A)',
            fontSize: 12,
            fontWeight: 750,
            textDecoration: 'none',
          }}
        >
          <FileText size={13} />
          <span>Contrat</span>
        </a>

        {isActif && (
          <>
            {onEditer && (
              <button
                type="button"
                onClick={() => onEditer(bail)}
                style={{
                  minHeight: 38,
                  padding: '0 10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  borderRadius: 8,
                  background: '#FAF8F5',
                  border: '1px solid var(--border, #E8DDD2)',
                  color: 'var(--navy, #1C2B4A)',
                  fontSize: 12,
                  fontWeight: 750,
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={13} />
                <span>Éditer</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onResilier(bail)}
              style={{
                minHeight: 38,
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                borderRadius: 8,
                background: '#FEE2E2',
                border: '1px solid #FECACA',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              <XCircle size={13} />
              <span>Résilier</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default BailCardMobile
