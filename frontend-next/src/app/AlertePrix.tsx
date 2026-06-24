'use client'
import { useState, useTransition } from 'react'
import { createAlerte } from './actions/alertes'

interface Props {
  produitId: string
  prixMin: number | null
  email: string
}

export default function AlertePrix({ produitId, prixMin, email }: Props) {
  const [open, setOpen]         = useState(false)
  const [prixCible, setPrix]    = useState(prixMin ? String(Math.round(prixMin * 0.9)) : '')
  const [emailVal, setEmail]    = useState(email)
  const [msg, setMsg]           = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const prix = Number(prixCible)
    if (!prix || prix <= 0) { setMsg('Prix invalide'); return }
    startTransition(async () => {
      const res = await createAlerte(produitId, prix, emailVal)
      if (res.ok) {
        setMsg('✅ Alerte créée — vous serez notifié par email.')
        setOpen(false)
      } else {
        setMsg(`❌ ${res.error}`)
      }
    })
  }

  if (!open) {
    return (
      <button className="alerte-trigger" onClick={() => setOpen(true)}>
        🔔 Créer une alerte prix
      </button>
    )
  }

  return (
    <div className="alerte-box">
      <div className="alerte-box-header">
        <span>🔔 Alerte prix</span>
        <button onClick={() => setOpen(false)} className="alerte-close" aria-label="Fermer">✕</button>
      </div>
      <p className="alerte-desc">
        Recevez un email quand le prix passe sous votre seuil.
      </p>
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
        <div className="alerte-field">
          <label className="alerte-label">Email de notification</label>
          <input
            type="email"
            value={emailVal}
            onChange={e => setEmail(e.target.value)}
            className="alerte-input"
            placeholder="votre@email.com"
            required
          />
        </div>
        {msg && <p className="alerte-msg">{msg}</p>}
        <button type="submit" className="alerte-submit" disabled={isPending}>
          {isPending ? 'Enregistrement…' : 'Activer l\'alerte'}
        </button>
      </form>
    </div>
  )
}
