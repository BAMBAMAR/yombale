'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { deleteAlerte, fetchUserAlertes } from '@/app/actions/alertes'
import { useTranslation } from '@/i18n/context'
import { fcfa } from '@/lib/format'
import { Bell, Trash2, ExternalLink, MessageCircle, Mail, Clock, Loader2, AlertCircle } from 'lucide-react'

interface Alerte {
  id: string
  produit_id: string
  produit_nom?: string
  prix_cible: number
  email?: string | null
  telephone?: string | null
  active?: boolean
  created_at: string
}

interface MesAlertesClientProps {
  userId: string
}

export default function MesAlertesClient({ userId }: MesAlertesClientProps) {
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { t } = useTranslation()

  const loadAlertes = async () => {
    try {
      setLoading(true)
      const result = await fetchUserAlertes(userId)
      if (!result.ok) {
        throw new Error(result.error || t('errors.serverError') || 'Erreur chargement')
      }
      setAlertes(result.alertes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : (t('errors.serverError') || 'Erreur inconnue'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      loadAlertes()
    }
  }, [userId])

  const handleDelete = async (id: string) => {
    if (!confirm(t('account.confirmDeleteAlert') || 'Voulez-vous vraiment supprimer cette alerte ?')) return

    setDeletingId(id)
    try {
      const result = await deleteAlerte(id)
      if (!result.ok) {
        throw new Error(result.error || t('errors.serverError') || 'Erreur suppression')
      }
      setAlertes((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
        <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: '#C75B00' }} />
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>{t('common.loading') || 'Chargement de vos alertes…'}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 10 }}>
        <AlertCircle size={20} />
        <div>
          <strong style={{ display: 'block', fontSize: 14 }}>Erreur de chargement</strong>
          <span style={{ fontSize: 12.5 }}>{error}</span>
        </div>
      </div>
    )
  }

  if (alertes.length === 0) {
    return (
      <div style={{
        padding: '36px 20px',
        textAlign: 'center',
        background: '#FAF8F5',
        border: '1.5px dashed #E8DDD2',
        borderRadius: 14,
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#FFF3E8',
          color: '#C75B00',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 12px',
        }}>
          <Bell size={24} />
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
          {t('account.alertsEmpty') || 'Aucune alerte active pour le moment'}
        </h3>
        <p style={{ margin: '0 auto 16px', color: '#64748B', fontSize: 13, maxWidth: 360, lineHeight: 1.5 }}>
          {t('account.alertsSubtitle') || 'Renseignez un produit ci-contre ou cliquez sur « Activer une alerte » sur n’importe quelle fiche produit du catalogue.'}
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#ffffff',
            border: '1.5px solid #CBD5E1',
            color: 'var(--navy, #1C2B4A)',
            padding: '8px 16px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          <span>🔍 Parcourir les produits</span>
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {alertes.map((alerte) => {
        const nomProduit = alerte.produit_nom || `Produit #${alerte.produit_id?.slice(0, 8)}…`
        const dateCreation = alerte.created_at
          ? new Date(alerte.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Récemment'

        return (
          <div
            key={alerte.id}
            style={{
              background: '#FAF8F5',
              border: '1px solid #E8DDD2',
              borderRadius: 14,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              transition: 'border-color 0.15s ease',
            }}
          >
            {/* Haut de la carte: Titre & Suppression */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Link
                  href={`/produit/${alerte.produit_id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--navy, #1C2B4A)',
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: 'none',
                    lineHeight: 1.4,
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {nomProduit}
                  </span>
                  <ExternalLink size={13} style={{ color: '#64748B', flexShrink: 0 }} />
                </Link>
              </div>

              {/* Bouton de suppression */}
              <button
                type="button"
                onClick={() => handleDelete(alerte.id)}
                disabled={deletingId === alerte.id}
                aria-label={t('account.adActionDelete') || 'Supprimer cette alerte'}
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  color: '#DC2626',
                  borderRadius: 8,
                  padding: '6px 10px',
                  cursor: deletingId === alerte.id ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  transition: 'all 0.12s ease',
                }}
              >
                {deletingId === alerte.id ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Supprimer</span>
                  </>
                )}
              </button>
            </div>

            {/* Détails: Prix cible & Canaux */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              flexWrap: 'wrap',
              borderTop: '1px solid #F0ECE6',
              paddingTop: 8,
            }}>
              {/* Prix cible */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>Prix cible :</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#C75B00' }}>
                  {fcfa(alerte.prix_cible)}
                </span>
              </div>

              {/* Badges de canaux */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {alerte.telephone && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#DCFCE7',
                      color: '#166534',
                      padding: '3px 8px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                    title={`Notification WhatsApp au ${alerte.telephone}`}
                  >
                    <MessageCircle size={12} />
                    <span>WhatsApp</span>
                  </span>
                )}

                {alerte.email && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#E0E7FF',
                      color: '#3730A3',
                      padding: '3px 8px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                    title={`Notification Email à ${alerte.email}`}
                  >
                    <Mail size={12} />
                    <span>Email</span>
                  </span>
                )}

                {/* Date */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#94A3B8', marginLeft: 4 }}>
                  <Clock size={11} />
                  <span>{dateCreation}</span>
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
