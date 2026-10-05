'use client'

import React, { useState } from 'react'
import {
  X,
  Crown,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import SurgaPremiumAvantages from './SurgaPremiumAvantages'

interface SurgaPremiumModalProps {
  isOpen: boolean
  onClose: () => void
  onAbonnementActive?: () => void
}

export default function SurgaPremiumModal({
  isOpen,
  onClose,
  onAbonnementActive,
}: SurgaPremiumModalProps) {
  const [cycle, setCycle] = useState<'mensuel' | 'annuel'>('mensuel')
  const [provider, setProvider] = useState<'wave' | 'orange_money'>('wave')
  const [telephone, setTelephone] = useState<string>('')
  const [chargement, setChargement] = useState<boolean>(false)
  const [etape, setEtape] = useState<'choix' | 'validation' | 'succes'>('choix')
  const [referencePaiement, setReferencePaiement] = useState<string>('')
  const [erreur, setErreur] = useState<string | null>(null)

  if (!isOpen) return null

  const montantActuel = cycle === 'mensuel' ? '1 500 FCFA' : '15 000 FCFA'

  const handleSouscrire = async () => {
    setChargement(true)
    setErreur(null)

    try {
      const res = await fetch('/api/surga/abonnements/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'b2c_premium',
          cycle,
          provider,
          phone: telephone || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors de l initiation du paiement.')
      }

      setReferencePaiement(data.reference)
      setEtape('validation')

      if (data.paiementUrl) {
        window.open(data.paiementUrl, '_blank')
      }
    } catch (err: any) {
      setErreur(err.message || 'Une erreur est survenue.')
    } finally {
      setChargement(false)
    }
  }

  const handleConfirmerPaiement = async () => {
    setChargement(true)
    setErreur(null)

    try {
      const res = await fetch('/api/surga/abonnements/verifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: referencePaiement }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Paiement non encore validé.')
      }

      setEtape('succes')
      if (onAbonnementActive) {
        onAbonnementActive()
      }
    } catch (err: any) {
      setErreur(err.message || 'Validation en attente. Veuillez patienter quelques instants.')
    } finally {
      setChargement(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--navy, #1C2B4A)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Crown size={20} color="#FBBF24" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Surga Premium</div>
              <div style={{ fontSize: 11, opacity: 0.85 }}>Votre assistant de poche d exception</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {etape === 'choix' && (
            <>
              {/* Sélecteur de cycle */}
              <div
                style={{
                  display: 'flex',
                  backgroundColor: 'var(--bg, #F8F5F0)',
                  borderRadius: 10,
                  padding: 4,
                  gap: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => setCycle('mensuel')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    backgroundColor: cycle === 'mensuel' ? '#FFFFFF' : 'transparent',
                    color: cycle === 'mensuel' ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
                    boxShadow: cycle === 'mensuel' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  Mensuel &bull; 1 500 FCFA
                </button>
                <button
                  type="button"
                  onClick={() => setCycle('annuel')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    backgroundColor: cycle === 'annuel' ? '#FFFFFF' : 'transparent',
                    color: cycle === 'annuel' ? 'var(--navy, #1C2B4A)' : 'var(--text2, #5A4E42)',
                    boxShadow: cycle === 'annuel' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    position: 'relative',
                  }}
                >
                  Annuel &bull; 15 000 FCFA
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: 8,
                      backgroundColor: 'var(--accent, #C75B00)',
                      color: '#FFFFFF',
                      fontSize: 9,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 10,
                    }}
                  >
                    -17%
                  </span>
                </button>
              </div>

              {/* Liste des privilèges */}
              <SurgaPremiumAvantages />

              {/* Moyen de paiement */}
              <div style={{ borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 8 }}>
                  Moyen de paiement sécurisé
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setProvider('wave')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: provider === 'wave' ? '2px solid #1BA3E8' : '1px solid var(--border, #E8DDD2)',
                      backgroundColor: provider === 'wave' ? 'rgba(27, 163, 232, 0.06)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      color: 'var(--navy, #1C2B4A)',
                    }}
                  >
                    <span>Wave Sénégal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('orange_money')}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: provider === 'orange_money' ? '2px solid #FF7900' : '1px solid var(--border, #E8DDD2)',
                      backgroundColor: provider === 'orange_money' ? 'rgba(255, 121, 0, 0.06)' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      color: 'var(--navy, #1C2B4A)',
                    }}
                  >
                    <span>Orange Money</span>
                  </button>
                </div>
              </div>

              {/* Téléphone WhatsApp / Portefeuille */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>
                  Numéro de téléphone mobile (optionnel)
                </label>
                <input
                  type="tel"
                  placeholder="Ex : 77 123 45 67"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border, #E8DDD2)',
                    fontSize: 13,
                  }}
                />
              </div>

              {erreur && (
                <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                  {erreur}
                </div>
              )}

              {/* Bouton d'action */}
              <button
                type="button"
                onClick={handleSouscrire}
                disabled={chargement}
                className="surga-btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: chargement ? 0.7 : 1,
                }}
              >
                <Lock size={16} />
                <span>Régler {montantActuel} et activer Premium</span>
                <ArrowRight size={16} />
              </button>
            </>
          )}

          {etape === 'validation' && (
            <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(27, 163, 232, 0.1)',
                  color: '#1BA3E8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <Crown size={28} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Validation de votre paiement
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
                La passerelle sécurisée s est ouverte dans un nouvel onglet. Dès que vous avez approuvé la transaction sur votre application mobile {provider === 'wave' ? 'Wave' : 'Orange Money'}, cliquez ci-dessous pour activer immédiatement vos avantages.
              </p>
              <div style={{ fontSize: 11, color: 'var(--text3, #73675E)' }}>
                Référence : <code>{referencePaiement}</code>
              </div>

              {erreur && (
                <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, padding: 8, backgroundColor: '#FEE2E2', borderRadius: 8 }}>
                  {erreur}
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmerPaiement}
                disabled={chargement}
                className="surga-btn-primary"
                style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 800 }}
              >
                {chargement ? 'Vérification en cours...' : 'J ai validé mon paiement'}
              </button>
            </div>
          )}

          {etape === 'succes' && (
            <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(10, 92, 54, 0.1)',
                  color: 'var(--price, #0A5C36)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Félicitations, vous êtes Premium !
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2, #5A4E42)', margin: 0 }}>
                Tous vos privilèges Surga sont désormais débloqués sans restriction : vocal illimité, alertes ultra-rapides et revues de presse en haute fidélité.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="surga-btn-primary"
                style={{ width: '100%', padding: '12px 16px', fontSize: 14, fontWeight: 800, marginTop: 8 }}
              >
                Accéder à mon espace
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
