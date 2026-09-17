'use client'

import React from 'react'
import {
  DollarSign,
  Phone,
  MessageCircle,
  FileText,
  Send,
  Pencil,
  Calendar,
  Home,
  User,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { getImmoAuthToken } from '@/lib/immo-auth'

export interface LoyerEcheance {
  id: string
  periode: string
  date_echeance: string
  montant_du: number
  montant_paye: number
  montant_restant: number
  statut: string
  quittance_url?: string
  bien_titre: string
  locataire_nom: string
  locataire_prenom?: string
  locataire_tel?: string
}

interface LoyerCardMobileProps {
  slug: string
  loyer: LoyerEcheance
  onEncaisser: (loyer: LoyerEcheance) => void
  onRelancer: (loyerId: string) => void
  onEditer: (loyer: LoyerEcheance) => void
}

export function LoyerCardMobile({
  slug,
  loyer,
  onEncaisser,
  onRelancer,
  onEditer,
}: LoyerCardMobileProps) {
  const token = getImmoAuthToken()
  const telNet = (loyer.locataire_tel || '').replace(/[^0-9]/g, '')
  const nomComplet = `${loyer.locataire_nom} ${loyer.locataire_prenom || ''}`.trim()
  const montantFormate = Number(loyer.montant_du).toLocaleString('fr-FR')
  const dateEcheance = new Date(loyer.date_echeance).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const waMessage = `Bonjour ${nomComplet}, rappel amical concernant l'échéance de loyer de ${montantFormate} FCFA pour le bien "${loyer.bien_titre}" (Période : ${loyer.periode}). Merci de procéder au règlement.`
  const waUrl = telNet ? `https://wa.me/${telNet}?text=${encodeURIComponent(waMessage)}` : null

  const isPaye = loyer.statut === 'paye'
  const isRetard = loyer.statut === 'retard'

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: `1px solid ${isRetard ? '#FECACA' : 'var(--border, #E8DDD2)'}`,
        boxShadow: '0 2px 8px rgba(28, 43, 74, 0.04)',
        padding: 14,
        marginBottom: 12,
      }}
    >
      {/* Ligne d'en-tête : Période + Statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} color="#64748B" />
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--navy, #1C2B4A)' }}>
            {loyer.periode}
          </span>
        </div>
        <div>
          {isPaye ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                background: '#DCFCE7',
                color: '#166534',
              }}
            >
              <CheckCircle2 size={12} />
              Payé
            </span>
          ) : isRetard ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                background: '#FEE2E2',
                color: '#DC2626',
              }}
            >
              <AlertCircle size={12} />
              En retard
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 800,
                background: '#FEF3C7',
                color: '#92400E',
              }}
            >
              <Clock size={12} />
              En attente
            </span>
          )}
        </div>
      </div>

      {/* Info Bien & Locataire */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--navy, #1C2B4A)', fontWeight: 700 }}>
          <Home size={13} color="var(--accent, #C75B00)" />
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {loyer.bien_titre}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#475569', marginTop: 3 }}>
          <User size={13} color="#64748B" />
          <span>{nomComplet}</span>
        </div>
        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 2 }}>
          Échéance limite : {dateEcheance}
        </div>
      </div>

      {/* Montant Dû & Acompte */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '8px 10px',
          background: '#FAF8F5',
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Montant dû :</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--price, #0A5C36)' }}>
            {montantFormate} FCFA
          </span>
          {loyer.montant_paye > 0 && !isPaye && (
            <div style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>
              Acompte reçu : {Number(loyer.montant_paye).toLocaleString('fr-FR')} FCFA
            </div>
          )}
        </div>
      </div>

      {/* Actions Tactiles */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        {!isPaye ? (
          <>
            <button
              type="button"
              onClick={() => onEncaisser(loyer)}
              style={{
                flex: 1,
                minWidth: 120,
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                borderRadius: 8,
                background: 'var(--accent, #C75B00)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: 13,
                fontWeight: 750,
                cursor: 'pointer',
              }}
            >
              <DollarSign size={15} />
              <span>Encaisser</span>
            </button>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  minHeight: 44,
                  padding: '0 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  borderRadius: 8,
                  background: '#25D366',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: 12.5,
                  fontWeight: 750,
                }}
                title="Relancer via WhatsApp"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => onRelancer(loyer.id)}
              style={{
                minHeight: 44,
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                background: '#FFFFFF',
                border: '1px solid var(--border, #E8DDD2)',
                color: 'var(--navy, #1C2B4A)',
                cursor: 'pointer',
              }}
              title="Enregistrer une relance"
            >
              <Send size={14} />
            </button>
          </>
        ) : (
          <a
            href={`/api/agences/agence/${slug}/documents/quittance/${loyer.id}.pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`}
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
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              fontSize: 13,
              fontWeight: 750,
              textDecoration: 'none',
            }}
          >
            <FileText size={15} />
            <span>Quittance PDF</span>
          </a>
        )}

        {telNet && (
          <a
            href={`tel:${telNet}`}
            style={{
              minHeight: 44,
              width: 44,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              background: '#F1F5F9',
              border: '1px solid #CBD5E1',
              color: 'var(--navy, #1C2B4A)',
              textDecoration: 'none',
            }}
            title="Appeler le locataire"
          >
            <Phone size={15} />
          </a>
        )}

        <button
          type="button"
          onClick={() => onEditer(loyer)}
          style={{
            minHeight: 44,
            width: 44,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            background: '#FFFFFF',
            border: '1px solid var(--border, #E8DDD2)',
            color: 'var(--navy, #1C2B4A)',
            cursor: 'pointer',
          }}
          title="Modifier l'échéance ou quittance"
        >
          <Pencil size={14} />
        </button>
      </div>
    </div>
  )
}

export default LoyerCardMobile
