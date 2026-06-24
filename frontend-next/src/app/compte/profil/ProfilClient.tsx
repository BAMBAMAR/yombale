'use client'
import { useState, useTransition } from 'react'

interface Props {
  nom: string
  email: string
}

export default function ProfilClient({ nom, email }: Props) {
  const [resetSent, setResetSent]   = useState(false)
  const [resetErr, setResetErr]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function demanderReset() {
    setResetErr(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/mot-de-passe-oublie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (res.ok) setResetSent(true)
        else setResetErr('Impossible d\'envoyer l\'email. Réessayez.')
      } catch {
        setResetErr('Erreur réseau. Réessayez.')
      }
    })
  }

  return (
    <div className="profil-sections">
      {/* Infos compte */}
      <div className="profil-section">
        <h2 className="profil-section-titre">Informations du compte</h2>
        <div className="profil-field-row">
          <div className="profil-field">
            <span className="profil-field-label">Nom</span>
            <span className="profil-field-value">{nom}</span>
          </div>
          <div className="profil-field">
            <span className="profil-field-label">Email</span>
            <span className="profil-field-value">{email}</span>
          </div>
        </div>
        <p className="profil-note">
          Pour modifier votre nom ou email, contactez le support.
        </p>
      </div>

      {/* Sécurité */}
      <div className="profil-section">
        <h2 className="profil-section-titre">Sécurité</h2>

        {resetSent ? (
          <div className="profil-success-box">
            ✅ Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
            Vérifiez votre boîte de réception.
          </div>
        ) : (
          <>
            <p className="profil-note">
              Un email de réinitialisation vous sera envoyé pour choisir un nouveau mot de passe.
            </p>
            {resetErr && <p className="profil-error">{resetErr}</p>}
            <button
              onClick={demanderReset}
              disabled={isPending}
              className="profil-reset-btn"
            >
              {isPending ? 'Envoi en cours…' : '🔑 Changer mon mot de passe'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
