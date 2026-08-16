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
  const [isPending, startTransition] = useTransition()
  const [open, setOpen]               = useState(false)
  const [canal, setCanal]             = useState<'whatsapp' | 'email' | 'les_deux'>('whatsapp')
  const [prixCible, setPrix]          = useState(prixMin ? String(Math.round(prixMin * 0.9)) : '')
  const [emailVal, setEmail]          = useState(email)
  const [telVal, setTel]              = useState(telephone)
  const [msg, setMsg]                 = useState<string | null>(null)
  const [isSuccess, setIsSuccess]    = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const prix = Number(prixCible)
    if (!prix || prix <= 0) {
      setMsg('Veuillez entrer un prix cible valide.')
      setIsSuccess(false)
      return
    }

    const needEmail = canal === 'email' || canal === 'les_deux'
    const needTel   = canal === 'whatsapp' || canal === 'les_deux'

    if (needTel && (!telVal || telVal.trim().length < 6)) {
      setMsg('Veuillez entrer un numéro WhatsApp valide (ex: 77 123 45 67).')
      setIsSuccess(false)
      return
    }
    if (needEmail && (!emailVal || !emailVal.includes('@'))) {
      setMsg('Veuillez entrer une adresse email valide.')
      setIsSuccess(false)
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
        setIsSuccess(true)
        setMsg('🎉 Alerte créée avec succès ! Vous recevrez une notification instantanée dès que le prix baisse.')
        setTimeout(() => setOpen(false), 3500)
      } else {
        setIsSuccess(false)
        setMsg(`❌ ${res.error || 'Erreur lors de la création de l\'alerte.'}`)
      }
    })
  }

  if (!open) {
    return (
      <button className="alerte-trigger" onClick={() => setOpen(true)} title="Recevoir une alerte WhatsApp/Email si le prix baisse">
        🔔 Activer une alerte baisse de prix
      </button>
    )
  }

  return (
    <div className="alerte-box" style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
      <div className="alerte-box-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 900, fontSize: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔔 Alerte baisse de prix
        </span>
        <button onClick={() => setOpen(false)} className="alerte-close" aria-label="Fermer" style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}>✕</button>
      </div>

      <p className="alerte-desc" style={{ fontSize: 12, color: '#64748b', marginBottom: 12, lineHeight: '1.4' }}>
        Soyez notifié sur WhatsApp et/ou par Email dès que cet article est disponible sous votre budget.
      </p>

      {/* Sélecteur de canal (WhatsApp / Email / Les deux) */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
        <button
          type="button"
          onClick={() => setCanal('whatsapp')}
          style={{
            flex: 1, padding: '7px 8px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            background: canal === 'whatsapp' ? '#25D366' : 'transparent',
            color: canal === 'whatsapp' ? '#ffffff' : '#475569',
            boxShadow: canal === 'whatsapp' ? '0 2px 6px rgba(37,211,102,0.3)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          💬 WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setCanal('email')}
          style={{
            flex: 1, padding: '7px 8px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            background: canal === 'email' ? '#0284c7' : 'transparent',
            color: canal === 'email' ? '#ffffff' : '#475569',
            boxShadow: canal === 'email' ? '0 2px 6px rgba(2,132,199,0.3)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          📧 Email
        </button>
        <button
          type="button"
          onClick={() => setCanal('les_deux')}
          style={{
            flex: 1, padding: '7px 8px', borderRadius: 8, border: 'none',
            fontSize: 12, fontWeight: 800, cursor: 'pointer',
            background: canal === 'les_deux' ? '#7c3aed' : 'transparent',
            color: canal === 'les_deux' ? '#ffffff' : '#475569',
            boxShadow: canal === 'les_deux' ? '0 2px 6px rgba(124,58,237,0.3)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          🔔 Les deux
        </button>
      </div>

      <form onSubmit={submit} className="alerte-form">
        <div className="alerte-field" style={{ marginBottom: 10 }}>
          <label className="alerte-label" style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#475569', marginBottom: 4 }}>Prix cible souhaité (FCFA) *</label>
          <input
            type="number"
            min="1"
            value={prixCible}
            onChange={e => setPrix(e.target.value)}
            className="alerte-input"
            placeholder="ex: 450 000"
            required
            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
          />
        </div>

        {(canal === 'whatsapp' || canal === 'les_deux') && (
          <div className="alerte-field" style={{ marginBottom: 10 }}>
            <label className="alerte-label" style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#475569', marginBottom: 4 }}>Numéro WhatsApp *</label>
            <input
              type="tel"
              value={telVal}
              onChange={e => setTel(e.target.value)}
              className="alerte-input"
              placeholder="Ex: 77 123 45 67"
              required={canal === 'whatsapp'}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
            />
          </div>
        )}

        {(canal === 'email' || canal === 'les_deux') && (
          <div className="alerte-field" style={{ marginBottom: 10 }}>
            <label className="alerte-label" style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#475569', marginBottom: 4 }}>Email de notification *</label>
            <input
              type="email"
              value={emailVal}
              onChange={e => setEmail(e.target.value)}
              className="alerte-input"
              placeholder="votre@email.com"
              required={canal === 'email'}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
            />
          </div>
        )}

        {msg && (
          <div
            style={{
              margin: '10px 0',
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 800,
              background: isSuccess ? '#f0fdf4' : '#fef2f2',
              color: isSuccess ? '#15803d' : '#b91c1c',
              border: `1.5px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
              lineHeight: '1.4'
            }}
          >
            {msg}
          </div>
        )}

        <button
          type="submit"
          className="alerte-submit"
          disabled={isPending}
          style={{
            width: '100%', padding: '11px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff', fontWeight: 900, fontSize: 13.5, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(16,185,129,0.25)', marginTop: 6
          }}
        >
          {isPending ? '⏳ Création de l\'alerte…' : '🔔 Activer l\'Alerte Baisse de Prix'}
        </button>
      </form>
    </div>
  )
}

