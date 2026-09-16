'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  X,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  FileSignature,
  Key,
  Users2,
  Wrench,
  ArrowRight,
  CheckCheck
} from 'lucide-react'
import { getImmoAuthHeaders } from '@/lib/immo-auth'

export interface NotificationItem {
  id: string
  type: string
  titre: string
  message: string
  lien?: string
  priorite: 'urgente' | 'normale' | 'info'
  lu: boolean
  metadonnees?: any
  created_at: string
}

export interface CompteursAlertes {
  demandes_visite: number
  loyers_retard: number
  montant_loyers_retard?: number
  mandats_expirants: number
  baux_expirants: number
  tickets_urgents: number
}

interface NotificationCenterModalProps {
  slug: string
  notifications: NotificationItem[]
  compteurs: CompteursAlertes
  onClose: () => void
  onRefresh: () => void
}

export default function NotificationCenterModal({
  slug,
  notifications,
  compteurs,
  onClose,
  onRefresh,
}: NotificationCenterModalProps) {
  const [filterType, setFilterType] = useState<string>('tous')
  const [markingAll, setMarkingAll] = useState(false)

  async function marquerCommeLu(notifId: string) {
    try {
      await fetch(`/api/agences/agence/${slug}/notifications/${notifId}/lire`, {
        method: 'PATCH',
        headers: getImmoAuthHeaders(),
      })
      onRefresh()
    } catch (err) {
      console.error('[MARK_READ_ERR]', err)
    }
  }

  async function marquerToutLu() {
    try {
      setMarkingAll(true)
      await fetch(`/api/agences/agence/${slug}/notifications/tout-lire`, {
        method: 'POST',
        headers: getImmoAuthHeaders(),
      })
      onRefresh()
    } catch (err) {
      console.error('[MARK_ALL_READ_ERR]', err)
    } finally {
      setMarkingAll(false)
    }
  }

  const notifsFiltrees = notifications.filter(n => {
    if (filterType === 'tous') return true
    if (filterType === 'visites') return n.type === 'demande_visite'
    if (filterType === 'loyers') return n.type === 'loyer_retard' || n.type === 'bail_expiration'
    if (filterType === 'mandats') return n.type === 'mandat_expiration'
    return true
  })

  function getIcon(type: string) {
    switch (type) {
      case 'demande_visite':
        return <Calendar size={16} color="var(--accent, #C75B00)" />
      case 'loyer_retard':
        return <AlertTriangle size={16} color="#DC2626" />
      case 'mandat_expiration':
        return <FileSignature size={16} color="#D97706" />
      case 'bail_expiration':
        return <Key size={16} color="#0284C7" />
      case 'maintenance_urgente':
        return <Wrench size={16} color="#991B1B" />
      default:
        return <Bell size={16} color="var(--navy, #1C2B4A)" />
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 43, 74, 0.4)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        zIndex: 1100,
        padding: '60px 24px 24px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          maxWidth: 480,
          width: '100%',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 30px rgba(0,0,0,0.15)',
          border: '1px solid var(--border, #E8DDD2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #E8DDD2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="var(--navy, #1C2B4A)" />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Centre de Notifications & Alertes
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Résumé des alertes opérationnelles en temps réel */}
        <div style={{ padding: '12px 20px', background: '#FAF8F5', borderBottom: '1px solid var(--border, #E8DDD2)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
            Alertes opérationnelles actives
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {compteurs.demandes_visite > 0 && (
              <Link
                href={`/agence/${slug}/visites?tab=demandes`}
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#FEF3C7',
                  color: '#92400E',
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid #FDE68A',
                }}
              >
                <Calendar size={13} />
                <span>{compteurs.demandes_visite} visite(s) à traiter</span>
              </Link>
            )}

            {compteurs.loyers_retard > 0 && (
              <Link
                href={`/agence/${slug}/locatif`}
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#FEE2E2',
                  color: '#991B1B',
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid #FECACA',
                }}
              >
                <AlertTriangle size={13} />
                <span>{compteurs.loyers_retard} loyer(s) impayé(s)</span>
              </Link>
            )}

            {compteurs.mandats_expirants > 0 && (
              <Link
                href={`/agence/${slug}/mandats`}
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: '#EDE9FE',
                  color: '#5B21B6',
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: 'none',
                  border: '1px solid #DDD6FE',
                }}
              >
                <FileSignature size={13} />
                <span>{compteurs.mandats_expirants} mandat(s) expirants</span>
              </Link>
            )}

            {compteurs.demandes_visite === 0 && compteurs.loyers_retard === 0 && compteurs.mandats_expirants === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontSize: 12, fontWeight: 700 }}>
                <CheckCircle2 size={14} />
                <span>Aucune alerte critique en attente. Votre gestion est à jour !</span>
              </div>
            )}
          </div>
        </div>

        {/* Filtres & Tout marquer comme lu */}
        <div
          style={{
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #F1EBE3',
          }}
        >
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'tous', label: 'Toutes' },
              { id: 'visites', label: 'Visites' },
              { id: 'loyers', label: 'Loyers' },
              { id: 'mandats', label: 'Mandats' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterType(f.id)}
                style={{
                  background: filterType === f.id ? 'var(--navy, #1C2B4A)' : '#FAF8F5',
                  color: filterType === f.id ? '#FFFFFF' : '#64748B',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={marquerToutLu}
            disabled={markingAll || notifications.length === 0}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent, #C75B00)',
              fontSize: 11.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <CheckCheck size={14} />
            <span>Tout marquer lu</span>
          </button>
        </div>

        {/* Liste des notifications */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {notifsFiltrees.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8', fontSize: 13 }}>
              Aucune notification dans cette vue
            </div>
          ) : (
            notifsFiltrees.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: n.lu ? '#FFFFFF' : '#FFFBF5',
                  border: n.lu ? '1px solid #F1EBE3' : '1px solid #FED7AA',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ marginTop: 2, flexShrink: 0 }}>{getIcon(n.type)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: n.lu ? 700 : 800, color: 'var(--navy, #1C2B4A)' }}>
                      {n.titre}
                    </div>
                    {!n.lu && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent, #C75B00)', flexShrink: 0 }} />
                    )}
                  </div>
                  <p style={{ fontSize: 12.5, color: '#475569', margin: '3px 0 6px', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>
                      {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {n.lien && (
                      <Link
                        href={n.lien.startsWith('/agence') ? n.lien : `/agence/${slug}${n.lien}`}
                        onClick={() => {
                          if (!n.lu) marquerCommeLu(n.id)
                          onClose()
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: 'var(--accent, #C75B00)',
                          textDecoration: 'none',
                        }}
                      >
                        <span>Traiter</span>
                        <ArrowRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
