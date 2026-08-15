'use client'
import { useState, useTransition, useEffect } from 'react'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateProfil } from '@/app/actions/auth'
import type { AuthState } from '@/app/actions/auth'

interface Props {
  nom: string
  email: string
}

const INIT: AuthState = {}

export default function ProfilClient({ nom, email }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [state, formAction]   = useFormState(updateProfil, INIT)

  // Reset password
  const [resetSent, setResetSent]     = useState(false)
  const [resetErr, setResetErr]       = useState<string | null>(null)
  const [isPending, startTransition]  = useTransition()

  useEffect(() => {
    if (state.message) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      setEditing(false)
      router.refresh()
    } else if (state.error) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }, [state, router])

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
      {/* Informations du compte */}
      <div className="profil-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="profil-section-titre" style={{ margin: 0 }}>Informations du compte</h2>
          {!editing && (
            <button
              onClick={() => { setEditing(true) }}
              className="profil-reset-btn"
              style={{ fontSize: 13, padding: '6px 14px' }}
            >
              ✏️ Modifier
            </button>
          )}
        </div>

        {!editing ? (
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
        ) : (
          <form action={formAction}>
            <div className="profil-field-row" style={{ flexDirection: 'column', gap: 14 }}>
              <div className="profil-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="profil-nom" className="profil-field-label">Nom</label>
                <input
                  id="profil-nom"
                  name="nom"
                  defaultValue={nom}
                  placeholder="Votre nom"
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
                />
              </div>
              <div className="profil-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="profil-email" className="profil-field-label">Email</label>
                <input
                  id="profil-email"
                  name="email"
                  type="email"
                  defaultValue={email}
                  placeholder="votre@email.com"
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}
                />
              </div>
            </div>

            {state.error && (
              <p className="profil-error" style={{ marginTop: 12 }}>{state.error}</p>
            )}
            {state.message && (
              <p className="profil-success-box" style={{ marginTop: 12 }}>{state.message}</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" className="profil-reset-btn" style={{ fontSize: 13 }}>
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false) }}
                style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer' }}
              >
                Annuler
              </button>
            </div>
          </form>
        )}
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
