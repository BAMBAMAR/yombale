'use client'
import { useState } from 'react'
import { declarerPaiementManuel } from '@/app/actions/paiement'

interface Props {
  reference: string
  montant: number
  numeroWave: string
  numeroOM: string
  onClose: () => void
  onSuccess: () => void
}

export default function ModalPaiementManuel({ reference, montant, numeroWave, numeroOM, onClose, onSuccess }: Props) {
  const [methode, setMethode] = useState<'wave' | 'orange'>('wave')
  const [telephone, setTelephone] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [preuve, setPreuve] = useState<File | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)

  const numero = methode === 'wave' ? numeroWave : numeroOM

  async function soumettre() {
    setErreur(null)
    if (!telephone) { setErreur('Indiquez le numéro utilisé pour le dépôt.'); return }
    if (!transactionId && !preuve) { setErreur('Indiquez l\'ID de transaction ou une capture d\'écran.'); return }

    setEnvoi(true)
    const res = await declarerPaiementManuel({
      reference, montant, methode,
      telephoneExpediteur: telephone,
      transactionId: transactionId || undefined,
      preuve: preuve || undefined,
    })
    setEnvoi(false)
    if (res.ok) setEnvoye(true)
    else setErreur(res.error ?? 'Erreur lors de l\'envoi')
  }

  if (envoye) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 32 }}>✅</p>
          <p style={{ fontWeight: 600 }}>Déclaration reçue</p>
          <p style={{ color: '#6b7280', fontSize: 14 }}>
            Votre paiement sera vérifié et activé sous peu. Vous serez contacté si besoin.
          </p>
          <button onClick={onSuccess} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, padding: 24 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Payer / j&apos;ai déjà payé</h3>
        <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
          Effectuez un dépôt de <strong>{montant.toLocaleString('fr-FR')} FCFA</strong> puis déclarez-le ci-dessous.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            onClick={() => setMethode('wave')}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: methode === 'wave' ? '2px solid #00a3e0' : '1px solid #d1d5db', background: methode === 'wave' ? '#e0f7ff' : '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            🌊 Wave
          </button>
          <button
            onClick={() => setMethode('orange')}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: methode === 'orange' ? '2px solid #ff6600' : '1px solid #d1d5db', background: methode === 'orange' ? '#fff2e6' : '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            🟠 Orange Money
          </button>
        </div>

        <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14 }}>
          Déposez sur le numéro : <strong>{numero || 'Numéro non configuré — contactez le support'}</strong>
        </div>

        <label htmlFor="pm-telephone" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Votre numéro de téléphone (expéditeur)</label>
        <input
          id="pm-telephone"
          type="tel"
          value={telephone}
          onChange={e => setTelephone(e.target.value)}
          placeholder="77 123 45 67"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12 }}
        />

        <label htmlFor="pm-transaction-id" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>ID de transaction (optionnel si preuve fournie)</label>
        <input
          id="pm-transaction-id"
          type="text"
          value={transactionId}
          onChange={e => setTransactionId(e.target.value)}
          placeholder="Référence de la transaction"
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12 }}
        />

        <label htmlFor="pm-preuve" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Capture d&apos;écran du paiement (optionnel si ID fourni)</label>
        <input
          id="pm-preuve"
          type="file"
          accept="image/*"
          onChange={e => setPreuve(e.target.files?.[0] ?? null)}
          style={{ marginBottom: 16 }}
        />

        {erreur && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{erreur}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
            Annuler
          </button>
          <button
            onClick={soumettre}
            disabled={envoi}
            style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: envoi ? '#9ca3af' : '#111827', color: '#fff', fontWeight: 700, cursor: envoi ? 'not-allowed' : 'pointer' }}
          >
            {envoi ? 'Envoi...' : 'J\'ai payé, envoyer ma déclaration'}
          </button>
        </div>
      </div>
    </div>
  )
}
