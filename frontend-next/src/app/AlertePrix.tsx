'use client'
import { useState, useTransition } from 'react'
import { createAlerte } from './actions/alertes'

interface Props {
  produitId: string
  prixMin: number | null
  email?: string
  telephone?: string
}

export default function AlertePrix({ produitId, prixMin, email = '', telephone = '' }: Props) {
  const [open, setOpen]               = useState(false)
  const [canal, setCanal]             = useState<'whatsapp' | 'email' | 'les_deux'>('whatsapp')
  const [prixCible, setPrix]          = useState(prixMin ? String(Math.round(prixMin * 0.9)) : '')
  const [emailVal, setEmail]          = useState(email)
  const [telVal, setTel]              = useState(telephone)
  const [msg, setMsg]                 = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const prix = Number(prixCible)
    if (!prix || prix <= 0) { setMsg('Prix cible invalide'); return }

    const needEmail = canal === 'email' || canal === 'les_deux'
    const needTel   = canal === 'whatsapp' || canal === 'les_deux'

    if (needTel && (!telVal || telVal.trim().length < 6)) {
      setMsg('Veuillez entrer un numéro WhatsApp valide.')
      return
    }
    if (needEmail && (!emailVal || !emailVal.includes('@'))) {
      setMsg('Veuillez entrer une adresse email valide.')
      return
    }

    startTransition(async () => {
      const res = await createAlerte(
        produitId,
        prix,
        needEmail ? emailVal.trim() : undefined,
        needTel ? telVal.trim() : undefined
      )
      if (res.ok) {
        setMsg('✅ Alerte créée ! Vous serez notifié dès que le prix baisse.')
        setTimeout(() => setOpen(false), 2500)
      } else {
        setMsg(`❌ ${res.error}`)
      }
    })
  }

  if (!open) {
    return (
      <button className="alerte-trigger" onClick={() => setOpen(true)}>
        🔔 Créer une alerte prix (WhatsApp / Email)
      </button>
    )
  }

  return (
    <div className="alerte-box">
      <div className="alerte-box-header">
        <span>🔔 Alerte baisse de prix</span>
        <button onClick={() => setOpen(false)} className="alerte-close" aria-label="Fermer">✕</button>
      </div>

      <p className="alerte-desc">
        Recevez une alerte sur WhatsApp et/ou Email quand le prix passe sous votre seuil.
      </p>

      {/* Sélecteur de canal (WhatsApp / Email / Les deux) */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
        <button
          type="button"
          onClick={() => setCanal('whatsapp')}
          style={{
            flex: 1, padding: '6px 8px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            background: canal === 'whatsapp' ? '#25D366' : 'transparent',
            color: canal === 'whatsapp' ? '#ffffff' : '#475569',
          }}
        >
          💬 WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setCanal('email')}
          style={{
            flex: 1, padding: '6px 8px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            background: canal === 'email' ? '#0284c7' : 'transparent',
            color: canal === 'email' ? '#ffffff' : '#475569',
          }}
        >
          📧 Email
        </button>
        <button
          type="button"
          onClick={() => setCanal('les_deux')}
          style={{
            flex: 1, padding: '6px 8px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            background: canal === 'les_deux' ? '#7c3aed' : 'transparent',
            color: canal === 'les_deux' ? '#ffffff' : '#475569',
          }}
        >
          🔔 Les deux
        </button>
      </div>

      <form onSubmit={submit} className="alerte-form">
        <div className="alerte-field">
          <label className="alerte-label">Prix cible (FCFA)</label>
          <input
            type="number"
            min="1"
            value={prixCible}
            onChange={e => setPrix(e.target.value)}
            className="alerte-input"
            placeholder="ex: 450 000"
            required
          />
        </div>

        {(canal === 'whatsapp' || canal === 'les_deux') && (
          <div className="alerte-field">
            <label className="alerte-label">Numéro WhatsApp *</label>
            <input
              type="tel"
              value={telVal}
              onChange={e => setTel(e.target.value)}
              className="alerte-input"
              placeholder="Ex: 77 123 45 67 ou +221771234567"
              required={canal === 'whatsapp'}
            />
          </div>
        )}

        {(canal === 'email' || canal === 'les_deux') && (
          <div className="alerte-field">
            <label className="alerte-label">Email de notification *</label>
            <input
              type="email"
              value={emailVal}
              onChange={e => setEmail(e.target.value)}
              className="alerte-input"
              placeholder="votre@email.com"
              required={canal === 'email'}
            />
          </div>
        )}

        {msg && <p className="alerte-msg" style={{ margin: '6px 0', fontSize: 12, fontWeight: 700 }}>{msg}</p>}

        <button type="submit" className="alerte-submit" disabled={isPending}>
          {isPending ? 'Enregistrement…' : 'Activer l\'alerte'}
        </button>
      </form>
    </div>
  )
}
