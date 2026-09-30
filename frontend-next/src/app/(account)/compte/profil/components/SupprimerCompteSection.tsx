'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Trash2, ShieldAlert, CheckCircle, RefreshCw, X } from 'lucide-react'
import { annulerSuppressionAction, getStatutSuppressionAction } from '@/app/actions/auth'

export default function SupprimerCompteSection() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)

  const [statut, setStatut] = useState<{
    en_cours_de_suppression: boolean
    jours_restants?: number | null
    date_limite?: string | null
  }>({ en_cours_de_suppression: false })

  const [isPending, startTransition] = useTransition()

  // Charger le statut au montage
  useEffect(() => {
    getStatutSuppressionAction().then(res => {
      if (res) {
        setStatut({
          en_cours_de_suppression: res.en_cours_de_suppression,
          jours_restants: res.jours_restants,
          date_limite: res.date_limite,
        })
      }
    })
  }, [])

  async function handleSupprimer(e: React.FormEvent) {
    e.preventDefault()
    if (confirmation.trim().toUpperCase() !== 'SUPPRIMER') {
      setErreur('Veuillez taper "SUPPRIMER" pour confirmer.')
      return
    }

    setLoading(true)
    setErreur(null)

    try {
      const res = await fetch('/api/auth/supprimer-compte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mot_de_passe: motDePasse, confirmation }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErreur(data.error || 'Erreur lors de la suppression du compte.')
        return
      }

      setModalOpen(false)
      setSucces(data.message || 'Votre compte a été programmé pour suppression.')
      // Redirection après 3 secondes
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2500)
    } catch {
      setErreur('Erreur réseau. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  function handleAnnulerSuppression() {
    setErreur(null)
    startTransition(async () => {
      const res = await annulerSuppressionAction()
      if (res.success) {
        setStatut({ en_cours_de_suppression: false })
        setSucces(res.message || 'Suppression annulée avec succès.')
        router.refresh()
      } else {
        setErreur(res.error || 'Impossible d\'annuler la suppression.')
      }
    })
  }

  return (
    <div className="profil-section" style={{ borderTop: '1px solid #fee2e2', marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <ShieldAlert size={20} color="#dc2626" />
        <h2 className="profil-section-titre" style={{ margin: 0, color: '#991b1b' }}>
          Zone de danger — Suppression du compte
        </h2>
      </div>

      {succes && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14
        }}>
          <CheckCircle size={18} color="#16a34a" />
          <span>{succes}</span>
        </div>
      )}

      {erreur && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14
        }}>
          <AlertTriangle size={18} color="#dc2626" />
          <span>{erreur}</span>
        </div>
      )}

      {statut.en_cours_de_suppression ? (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 10,
          padding: 16,
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <AlertTriangle size={24} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#92400e', fontSize: 15 }}>
                Compte en cours de suppression (Période de grâce de 30 jours)
              </p>
              <p style={{ margin: '0 0 14px 0', color: '#78350f', fontSize: 13, lineHeight: 1.5 }}>
                Ce compte sera définitivement purgé dans <strong>{statut.jours_restants ?? 30} jours</strong> (le {statut.date_limite || 'terme'}).
                Durant cette période, vous pouvez annuler cette procédure à tout moment.
              </p>
              <button
                type="button"
                onClick={handleAnnulerSuppression}
                disabled={isPending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#0A5C36',
                  color: '#ffffff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isPending ? 'not-allowed' : 'pointer'
                }}
              >
                <RefreshCw size={15} className={isPending ? 'spin' : ''} />
                {isPending ? 'Annulation en cours...' : 'Annuler la suppression et conserver mon compte'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 16px 0' }}>
            Conformément au RGPD (Art. 17), vous pouvez demander la suppression définitive de votre compte et de toutes vos données personnelles.
            Une période de grâce de <strong>30 jours</strong> s'appliquera, durant laquelle vous pourrez annuler la demande en vous reconnectant.
          </p>

          <button
            type="button"
            onClick={() => { setModalOpen(true); setErreur(null); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              padding: '9px 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <Trash2 size={16} />
            Supprimer mon compte
          </button>
        </div>
      )}

      {/* ── Modal de Confirmation Sécurisée ── */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 14,
            maxWidth: 480,
            width: '100%',
            padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            position: 'relative'
          }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer'
              }}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{
                background: '#fee2e2',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={20} color="#dc2626" />
              </div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
                Supprimer votre compte Nopalou
              </h3>
            </div>

            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Cette action engagera la procédure de suppression définitive. Vos boutiques, annonces et alertes seront masquées du public.
              Vous disposerez de <strong>30 jours</strong> pour annuler.
            </p>

            <form onSubmit={handleSupprimer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={motDePasse}
                  onChange={e => setMotDePasse(e.target.value)}
                  placeholder="Votre mot de passe"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Pour confirmer, veuillez saisir <strong>SUPPRIMER</strong> ci-dessous :
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={e => setConfirmation(e.target.value)}
                  placeholder="Tapez SUPPRIMER"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {erreur && (
                <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 0 0' }}>{erreur}</p>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || confirmation.trim().toUpperCase() !== 'SUPPRIMER'}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: confirmation.trim().toUpperCase() === 'SUPPRIMER' ? '#dc2626' : '#94a3b8',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: confirmation.trim().toUpperCase() === 'SUPPRIMER' && !loading ? 'pointer' : 'not-allowed'
                  }}
                >
                  {loading ? 'Traitement...' : 'Confirmer la suppression'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
