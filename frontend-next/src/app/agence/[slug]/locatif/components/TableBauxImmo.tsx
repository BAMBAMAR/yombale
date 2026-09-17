'use client'

import React, { useState } from 'react'
import { Key, Plus, FileText, XCircle, AlertTriangle } from 'lucide-react'
import { getImmoAuthToken, getImmoAuthHeaders } from '@/lib/immo-auth'
import BailCardMobile from './BailCardMobile'

export interface BailItem {
  id: string
  bien_titre: string
  locataire_nom: string
  locataire_prenom?: string
  locataire_tel?: string
  loyer_mensuel: number
  charges: number
  depot_garantie?: number
  date_debut: string
  date_fin?: string
  statut: string
  nb_impayes?: number
}

interface TableBauxImmoProps {
  slug: string
  baux: BailItem[]
  onNouveauBail: () => void
  onRefresh?: () => void
}

export default function TableBauxImmo({ slug, baux, onNouveauBail, onRefresh }: TableBauxImmoProps) {
  const [bailAResilier, setBailAResilier] = useState<BailItem | null>(null)
  const [motif, setMotif] = useState('')
  const [loadingResiliation, setLoadingResiliation] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const token = getImmoAuthToken()

  async function handleConfirmerResiliation(e: React.FormEvent) {
    e.preventDefault()
    if (!bailAResilier) return

    try {
      setLoadingResiliation(true)
      setErrorMsg(null)

      const res = await fetch(`/api/locatif-immo/agence/${slug}/baux/${bailAResilier.id}/resilier`, {
        method: 'POST',
        headers: getImmoAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ motif: motif.trim() || 'Fin de bail ou résiliation amiable' }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de la résiliation du bail.')
      }

      setBailAResilier(null)
      setMotif('')
      if (onRefresh) onRefresh()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoadingResiliation(false)
    }
  }

  if (baux.length === 0) {
    return (
      <div className="agence-card" style={{ textAlign: 'center', padding: '50px 20px', color: '#64748B' }}>
        <Key size={36} style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--accent, #C75B00)' }} />
        <p style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 17 }}>Aucun bail enregistré</p>
        <p style={{ fontSize: 13.5, maxWidth: 450, margin: '6px auto 16px' }}>
          Associez un locataire à un bien immobilier pour créer votre premier contrat de bail locatif.
        </p>
        <button
          type="button"
          onClick={onNouveauBail}
          className="agence-btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
        >
          <Plus size={16} />
          <span>Nouveau Contrat de Bail</span>
        </button>
      </div>
    )
  }

  return (
    <>
      {/* ── Version Mobile : Cartes tactiles ── */}
      <div className="immo-mobile-only">
        {baux.map((b) => (
          <BailCardMobile
            key={b.id}
            slug={slug}
            bail={b}
            onResilier={(item) => {
              setBailAResilier(item)
              setMotif('')
              setErrorMsg(null)
            }}
          />
        ))}
      </div>

      {/* ── Version Desktop : Table complète ── */}
      <div className="immo-desktop-only agence-table-wrapper">
        <table className="agence-table">
          <thead>
            <tr>
              <th>Bien Loué</th>
              <th>Locataire</th>
              <th>Loyer Mensuel</th>
              <th>Période du Bail</th>
              <th>Statut</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {baux.map(b => {
              const bailPdfUrl = `/api/agences/agence/${slug}/documents/bail/${b.id}.pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`
              const isActif = b.statut === 'actif'

              return (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 750, color: 'var(--navy, #1C2B4A)' }}>{b.bien_titre}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>
                      {b.locataire_nom} {b.locataire_prenom || ''}
                    </div>
                    {b.locataire_tel && <div style={{ fontSize: 12, color: '#64748B' }}>{b.locataire_tel}</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                      {Number(b.loyer_mensuel).toLocaleString('fr-FR')} FCFA
                    </div>
                    {b.charges > 0 && (
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>
                        + {Number(b.charges).toLocaleString('fr-FR')} FCFA ch.
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                      Du {new Date(b.date_debut).toLocaleDateString('fr-FR')}
                    </div>
                    {b.date_fin && (
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>
                        au {new Date(b.date_fin).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${isActif ? 'actif' : 'ferme'}`}>
                      {b.statut === 'actif' ? 'Actif' : b.statut === 'resilie' ? 'Résilié' : b.statut || 'Inactif'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                      <a
                        href={bailPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '6px 10px',
                          borderRadius: 6,
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          color: 'var(--navy, #1C2B4A)',
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                        title="Télécharger le Contrat de Bail officiel"
                      >
                        <FileText size={13} />
                        <span>Contrat PDF</span>
                      </a>

                      {isActif && (
                        <button
                          type="button"
                          onClick={() => {
                            setBailAResilier(b)
                            setMotif('')
                            setErrorMsg(null)
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 10px',
                            borderRadius: 6,
                            background: '#FEE2E2',
                            border: '1px solid #FECACA',
                            color: '#DC2626',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Résilier ce bail et libérer le bien"
                        >
                          <XCircle size={13} />
                          <span>Résilier</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modale de Résiliation */}
      {bailAResilier && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 43, 74, 0.55)',
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
              borderRadius: 14,
              maxWidth: 480,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, color: '#DC2626' }}>
              <AlertTriangle size={24} />
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: 'var(--navy, #1C2B4A)' }}>
                Résilier le contrat de bail
              </h2>
            </div>

            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
              Vous vous apprêtez à résilier le bail de <strong>{bailAResilier.locataire_nom}</strong> pour le bien{' '}
              <strong>{bailAResilier.bien_titre}</strong>. Le bien redeviendra automatiquement <strong>disponible</strong>{' '}
              et les échéances futures non réglées seront annulées.
            </p>

            {errorMsg && (
              <div
                style={{
                  padding: '10px 12px',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 12,
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleConfirmerResiliation}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Motif de résiliation (Optionnel)
                </label>
                <textarea
                  rows={3}
                  value={motif}
                  onChange={e => setMotif(e.target.value)}
                  className="form-input"
                  placeholder="ex: Départ volontaire locataire, fin de bail convenue, déménagement..."
                  style={{ width: '100%', padding: '9px 12px', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setBailAResilier(null)}
                  disabled={loadingResiliation}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: '#FAF8F5',
                    border: '1px solid var(--border, #E8DDD2)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loadingResiliation}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: '#DC2626',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: loadingResiliation ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loadingResiliation ? 'Résiliation en cours...' : 'Confirmer la résiliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
