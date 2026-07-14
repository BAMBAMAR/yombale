'use client'

import { useState, useTransition } from 'react'
import { renvoyerEmailVerification } from '@/app/actions/auth'

export default function BannerEmailNonVerifie() {
  const [envoye, setEnvoye]     = useState(false)
  const [erreur, setErreur]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleRenvoyer() {
    setErreur(null)
    startTransition(async () => {
      const res = await renvoyerEmailVerification()
      if (res.error) {
        setErreur(res.error)
      } else {
        setEnvoye(true)
      }
    })
  }

  return (
    <div
      className="email-verif-banner"
      role="alert"
      aria-live="polite"
    >
      <span className="email-verif-banner__icon">✉️</span>
      {envoye ? (
        <span className="email-verif-banner__msg">
          <strong>Email envoyé ✓</strong> Vérifiez votre boîte mail (et vos spams) pour confirmer votre adresse.
        </span>
      ) : (
        <span className="email-verif-banner__msg">
          Vérifiez votre adresse email pour pouvoir publier des annonces.{' '}
          {erreur && <span className="email-verif-banner__err"> {erreur}</span>}
          <button
            className="email-verif-banner__btn"
            onClick={handleRenvoyer}
            disabled={isPending}
            aria-label="Renvoyer le lien de confirmation"
          >
            {isPending ? 'Envoi…' : 'Renvoyer le lien'}
          </button>
        </span>
      )}
    </div>
  )
}
