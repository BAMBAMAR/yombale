'use client'

import { useState, useTransition } from 'react'
import { renvoyerEmailVerification } from '@/app/actions/auth'
import { useTranslation } from '@/i18n/context'

export default function BannerEmailNonVerifie() {
  const [envoye, setEnvoye]     = useState(false)
  const [erreur, setErreur]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { t } = useTranslation()

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
          <strong>{t('account.verificationEmailSent')}</strong>
        </span>
      ) : (
        <span className="email-verif-banner__msg">
          {t('account.unverifiedEmailBanner')}{' '}
          {erreur && <span className="email-verif-banner__err"> {erreur}</span>}
          <button
            className="email-verif-banner__btn"
            onClick={handleRenvoyer}
            disabled={isPending}
            aria-label={t('account.resendVerificationEmail')}
          >
            {isPending ? t('common.pleaseWait') : t('account.resendVerificationEmail')}
          </button>
        </span>
      )}
    </div>
  )
}
