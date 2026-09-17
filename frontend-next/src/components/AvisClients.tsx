'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslation } from '@/i18n/context'
import { Star, CheckCircle2, X, MessageSquare, Check, ShieldCheck } from 'lucide-react'

interface Avis {
  id: string
  nom_client: string
  note: number
  commentaire: string | null
  verifie: boolean
  created_at: string
  produit_nom?: string | null
}

export default function AvisClients({ boutiqueId, produitId }: { boutiqueId: string; produitId?: string }) {
  const { t, formatNumber } = useTranslation()
  const searchParams = useSearchParams()
  const avisRef = searchParams?.get('avis_ref')

  const [avisList, setAvisList] = useState<Avis[]>([])
  const [noteMoyenne, setNoteMoyenne] = useState<string>('5.0')
  const [totalAvis, setTotalAvis] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [modalAvis, setModalAvis] = useState<boolean>(false)

  // Form state
  const [nomClient, setNomClient] = useState<string>('')
  const [note, setNote] = useState<number>(5)
  const [commentaire, setCommentaire] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  function loadAvis() {
    setLoading(true)
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/avis`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAvisList(data.avis || [])
          setNoteMoyenne(data.note_moyenne || '5.0')
          setTotalAvis(data.total_avis || 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAvis()
    if (avisRef) {
      setModalAvis(true)
    }
  }, [boutiqueId, avisRef])

  async function submitAvis(e: React.FormEvent) {
    e.preventDefault()
    if (!nomClient.trim()) return
    setSubmitting(true)
    setErrorMsg(null)

    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/avis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom_client: nomClient.trim(),
          note,
          commentaire: commentaire.trim() || undefined,
          produit_id: produitId,
          reference_commande: avisRef || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('common.error'))

      setSuccessMsg(t('shop.reviewPublishedSuccess'))
      setNomClient('')
      setCommentaire('')
      loadAvis()
      setTimeout(() => {
        setModalAvis(false)
        setSuccessMsg(null)
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, max = 5, size = 14) => {
    return (
      <div style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            size={size}
            fill={i < Math.round(rating) ? '#f59e0b' : 'none'}
            color={i < Math.round(rating) ? '#f59e0b' : '#cbd5e1'}
          />
        ))}
      </div>
    )
  }

  return (
    <div id="avis" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20, marginTop: 24 }}>
      {/* Header Avis & Note Moyenne */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontFamily: 'var(--font-archivo), sans-serif', color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={18} color="var(--accent, #C75B00)" />
            {t('shop.reviewsAndRatingsTitle')} ({formatNumber(totalAvis)})
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>{formatNumber(noteMoyenne)}</span>
            {renderStars(Number(noteMoyenne), 5, 16)}
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              ({formatNumber(totalAvis)} {t('shop.evaluationsCount')})
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalAvis(true)}
          style={{
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            color: '#374151',
            boxShadow: '0 1px 3px rgba(0,0,0,.05)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Star size={14} color="#f59e0b" fill="#f59e0b" />
          {t('shop.leaveReviewBtn')}
        </button>
      </div>

      {/* Liste des avis */}
      {loading ? (
        <p style={{ color: '#9ca3af', fontSize: 13 }}>{t('common.loadingReviews')}</p>
      ) : avisList.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic', margin: 0 }}>
          {t('common.firstReviewPrompt')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {avisList.map((a) => (
            <div key={a.id} style={{ background: 'var(--bg, #F8F5F0)', border: '1px solid var(--border, #E8DDD2)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{a.nom_client}</span>
                  {a.verifie && (
                    <span style={{ fontSize: 11, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={12} />
                      {t('shop.verifiedPurchase')}
                    </span>
                  )}
                </div>
                {renderStars(a.note, 5, 13)}
              </div>

              {a.produit_nom && (
                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                  {t('shop.article')} : {a.produit_nom}
                </p>
              )}

              {a.commentaire && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#334155', lineHeight: 1.4 }}>{a.commentaire}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modale Déposer un avis */}
      {modalAvis && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, boxShadow: '0 20px 50px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontFamily: 'var(--font-archivo), sans-serif' }}>{t('common.rateShop')}</h3>
                {avisRef && (
                  <div style={{ fontSize: 11.5, color: '#166534', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, fontWeight: 700 }}>
                    <ShieldCheck size={13} />
                    Avis certifié commande #{avisRef}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalAvis(false)}
                aria-label="Fermer"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {successMsg ? (
              <div style={{ background: '#f0fdf4', color: '#166534', padding: 16, borderRadius: 10, textAlign: 'center', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <CheckCircle2 size={18} />
                {successMsg}
              </div>
            ) : (
              <form onSubmit={submitAvis} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: 'var(--red, #dc2626)', padding: '8px 12px', borderRadius: 6, fontSize: 13 }}>
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {t('common.fullNameRequired')}
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="ex: Aminata Diallo"
                    value={nomClient}
                    onChange={(e) => setNomClient(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    {t('common.yourRatingRequired')}
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNote(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                        aria-label={`${star} étoiles`}
                      >
                        <Star size={28} fill={star <= note ? '#f59e0b' : 'none'} color={star <= note ? '#f59e0b' : '#d1d5db'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                    {t('common.yourComment')}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Qu'avez-vous pensé de la qualité des produits et du service de livraison ?"
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: 'var(--accent, #C75B00)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(199,91,0,.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Check size={16} />
                  {submitting ? t('common.loading') : t('shop.publishReviewBtn')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
