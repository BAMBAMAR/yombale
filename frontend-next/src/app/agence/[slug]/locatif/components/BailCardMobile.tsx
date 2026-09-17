'use client'

import React from 'react'
import {
  Key,
  FileText,
  XCircle,
  Calendar,
  Home,
  User,
  Phone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { getImmoAuthToken } from '@/lib/immo-auth'
import { BailItem } from './TableBauxImmo'

interface BailCardMobileProps {
  slug: string
  bail: BailItem
  onResilier: (bail: BailItem) => void
}

export function BailCardMobile({ slug, bail, onResilier }: BailCardMobileProps) {
  const token = getImmoAuthToken()
  const isActif = bail.statut === 'actif'
  const telNet = (bail.locataire_tel || '').replace(/[^0-9]/g, '')
  const nomComplet = `${bail.locataire_nom} ${bail.locataire_prenom || ''}`.trim()
  const bailPdfUrl = `/api/agences/agence/${slug}/documents/bail/${bail.id}.pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1px solid var(--border, #E8DDD2)',
        boxShadow: '0 2px 8px rgba(28, 43, 74, 0.04)',
        padding: 14,
        marginBottom: 12,
      }}
    >
      {/* Ligne d'en-tête : Bien + Statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Home size={15} color="var(--accent, #C75B00)" />
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>
            {bail.bien_titre}
          </span>
        </div>
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
      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={bailPdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1,
            minHeight: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            borderRadius: 8,
            background: '#F1F5F9',
            border: '1px solid #CBD5E1',
            color: 'var(--navy, #1C2B4A)',
            fontSize: 12.5,
            fontWeight: 750,
            textDecoration: 'none',
          }}
        >
          <FileText size={15} />
          <span>Contrat PDF</span>
        </a>

        {isActif && (
          <button
            type="button"
            onClick={() => onResilier(bail)}
            style={{
              minHeight: 44,
              padding: '0 14px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              borderRadius: 8,
              background: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: 12.5,
              fontWeight: 750,
              cursor: 'pointer',
            }}
          >
            <XCircle size={14} />
            <span>Résilier</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default BailCardMobile
