'use client'
import { useState, useTransition, useEffect } from 'react'
import { useFormState } from 'react-dom'
import { useRouter } from 'next/navigation'
import { updateProfil } from '@/app/actions/auth'
import type { AuthState } from '@/app/actions/auth'
import { useTranslation } from '@/i18n/context'

interface Props {
  nom: string
  email: string
  telephone?: string | null
}

const INIT: AuthState = {}

export default function ProfilClient({ nom, email, telephone }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [state, formAction]   = useFormState(updateProfil, INIT)
  const { t } = useTranslation()

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
        else setResetErr(t('errors.networkError'))
      } catch {
        setResetErr(t('errors.networkError'))
      }
    })
  }

  return (
    <div className="profil-sections">
      {/* Informations du compte */}
      <div className="profil-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="profil-section-titre" style={{ margin: 0 }}>{t('account.profileTitle')}</h2>
          {!editing && (
            <button
              onClick={() => { setEditing(true) }}
              className="profil-reset-btn"
              style={{ fontSize: 13, padding: '6px 14px' }}
            >
              {t('common.edit')}
            </button>
          )}
        </div>

        {!editing ? (
          <div className="profil-field-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="profil-field">
              <span className="profil-field-label">{t('account.profileName')}</span>
              <span className="profil-field-value">{nom || 'Non renseigné'}</span>
            </div>
            <div className="profil-field">
              <span className="profil-field-label">{t('account.profileEmail')}</span>
              <span className="profil-field-value">{email || 'Non renseigné'}</span>
            </div>
            <div className="profil-field">
              <span className="profil-field-label">{t('account.profilePhone')} / WhatsApp</span>
              <span className="profil-field-value" style={{ color: telephone ? 'var(--navy, #1C2B4A)' : '#94a3b8' }}>
                {telephone || 'Non renseigné'}
              </span>
            </div>
          </div>
        ) : (
          <form action={formAction}>
            <div className="profil-field-row" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="profil-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="profil-nom" className="profil-field-label">{t('account.profileName')}</label>
                <input
                  id="profil-nom"
                  name="nom"
                  defaultValue={nom}
                  placeholder={t('auth.nomPlaceholder')}
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                />
              </div>
              <div className="profil-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="profil-email" className="profil-field-label">{t('account.profileEmail')}</label>
                <input
                  id="profil-email"
                  name="email"
                  type="email"
                  defaultValue={email}
                  placeholder={t('auth.emailPlaceholder')}
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                />
              </div>
              <div className="profil-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="profil-telephone" className="profil-field-label">{t('account.profilePhone')} / WhatsApp</label>
                <input
                  id="profil-telephone"
                  name="telephone"
                  type="tel"
                  defaultValue={telephone || ''}
                  placeholder="Ex: 77 123 45 67 ou 221771234567"
                  style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
                />
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Utilisé pour le suivi automatique de vos commandes et les notifications WhatsApp.
                </span>
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
                {t('common.save')}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false) }}
                style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'transparent', cursor: 'pointer' }}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sécurité */}
      <div className="profil-section">
        <h2 className="profil-section-titre">{t('auth.passwordLabel')}</h2>

        {resetSent ? (
          <div className="profil-success-box">
            {t('auth.resetLinkSent')}
          </div>
        ) : (
          <>
            <p className="profil-note">
              {t('auth.forgotSubtitle')}
            </p>
            {resetErr && <p className="profil-error">{resetErr}</p>}
            <button
              onClick={demanderReset}
              disabled={isPending}
              className="profil-reset-btn"
            >
              {isPending ? t('common.pleaseWait') : `${t('auth.sendResetLink')}`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
