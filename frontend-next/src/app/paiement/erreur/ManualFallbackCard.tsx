'use client'

import { useState } from 'react'

export function ManualFallbackCard({ reference }: { reference?: string }) {
  const [copied, setCopied] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [telExpediteur, setTelExpediteur] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [methode, setMethode] = useState<'wave' | 'orange'>('wave')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const NUMERO_DEPOT = '777202086'

  function copierNumero() {
    navigator.clipboard.writeText(NUMERO_DEPOT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function declarerPaiement(e: React.FormEvent) {
    e.preventDefault()
    if (!reference) {
      setError('Référence de commande manquante.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://yombale.onrender.com'
      const res = await fetch(`${backendUrl}/api/paiement/manuel/declarer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nopalou_token') || ''}`,
        },
        body: JSON.stringify({
          reference,
          montant: 100, // indicatif
          methode,
          telephone_expediteur: telExpediteur,
          transaction_id_client: transactionId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur lors de l\'enregistrement')
      } else {
        setSubmitted(true)
      }
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      marginTop: 24, padding: 20, borderRadius: 16, background: '#FFFBEB',
      border: '1.5px solid #FCD34D', textAlign: 'left',
      boxShadow: '0 4px 12px rgba(245,158,11,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 24 }}>💡</span>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#92400E' }}>
          Alternative : Régler par Dépôt Manuel Direct
        </h3>
      </div>

      <p style={{ margin: '0 0 14px', fontSize: 13, color: '#78350F', lineHeight: 1.4 }}>
        Vous rencontrez un souci avec l&apos;application Wave ? Effectuez votre transfert manuellement vers le numéro marchand Nopalou ci-dessous :
      </p>

      {/* Numéro marchand + Copier */}
      <div style={{
        background: '#FFFFFF', border: '1px dashed #F59E0B', borderRadius: 12,
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 14
      }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
            Numéro de Dépôt / Transfert
          </span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#111827', fontFamily: 'monospace' }}>
            77 720 20 86
          </span>
        </div>
        <button
          type="button"
          onClick={copierNumero}
          style={{
            background: copied ? '#16A34A' : '#D97706', color: '#FFF', border: 'none',
            borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            transition: 'background 0.2s'
          }}
        >
          {copied ? '✅ Copié !' : '📋 Copier'}
        </button>
      </div>

      {/* Bouton Toggle Formulaire */}
      {!showForm && !submitted && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          style={{
            width: '100%', background: '#92400E', color: '#FFF', border: 'none',
            borderRadius: 10, padding: '12px', fontWeight: 800, fontSize: 14, cursor: 'pointer'
          }}
        >
          ✍️ Saisir ma preuve de transfert →
        </button>
      )}

      {/* Confirmation envoi */}
      {submitted && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: 10, padding: 14, textAlign: 'center' }}>
          <span style={{ fontSize: 28 }}>🎉</span>
          <h4 style={{ margin: '4px 0 2px', fontSize: 15, color: '#166534', fontWeight: 800 }}>Déclaration transmise !</h4>
          <p style={{ margin: 0, fontSize: 13, color: '#15803D' }}>
            Notre équipe valide votre paiement dans les minutes qui suivent. Merci de votre patience !
          </p>
        </div>
      )}

      {/* Formulaire de saisie ID */}
      {showForm && !submitted && (
        <form onSubmit={declarerPaiement} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', color: '#DC2626', fontSize: 12 }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#78350F', display: 'block', marginBottom: 4 }}>
              Méthode utilisée
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => setMethode('wave')}
                style={{
                  padding: '8px', borderRadius: 8, border: '1px solid',
                  borderColor: methode === 'wave' ? '#D97706' : '#E5E7EB',
                  background: methode === 'wave' ? '#FEF3C7' : '#FFF',
                  color: methode === 'wave' ? '#92400E' : '#374151',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer'
                }}
              >
                🌊 Wave
              </button>
              <button
                type="button"
                onClick={() => setMethode('orange')}
                style={{
                  padding: '8px', borderRadius: 8, border: '1px solid',
                  borderColor: methode === 'orange' ? '#D97706' : '#E5E7EB',
                  background: methode === 'orange' ? '#FEF3C7' : '#FFF',
                  color: methode === 'orange' ? '#92400E' : '#374151',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer'
                }}
              >
                🟠 Orange Money
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#78350F', display: 'block', marginBottom: 4 }}>
              Votre numéro de téléphone (Expéditeur) *
            </label>
            <input
              required
              type="tel"
              value={telExpediteur}
              onChange={e => setTelExpediteur(e.target.value)}
              placeholder="Ex: 77 000 00 00"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
                fontSize: 13, boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#78350F', display: 'block', marginBottom: 4 }}>
              ID de la transaction (reçu SMS / App) *
            </label>
            <input
              required
              type="text"
              value={transactionId}
              onChange={e => setTransactionId(e.target.value)}
              placeholder="Ex: WAV-12345678"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
                fontSize: 13, boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, background: loading ? '#9CA3AF' : '#16A34A', color: '#FFF',
              border: 'none', borderRadius: 10, padding: '11px', fontWeight: 800, fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Envoi en cours…' : '🚀 Valider ma déclaration'}
          </button>
        </form>
      )}
    </div>
  )
}
