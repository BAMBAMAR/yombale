'use client'
import { useState, useTransition } from 'react'
import { initierWaveAnnonce, initierOrangeAnnonce } from '@/app/actions/paiement'

interface Props {
  annonceId: string
  titreCourt: string
}

export default function PaiementClient({ annonceId, titreCourt }: Props) {
  const [error, setError]                     = useState<string | null>(null)
  const [pendingWave, startWave]             = useTransition()
  const [pendingOrange, startOrange]         = useTransition()

  function payerWave() {
    setError(null)
    startWave(async () => {
      const res = await initierWaveAnnonce(annonceId)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        setError(res.error ?? 'Impossible d\'initialiser le paiement Wave.')
      }
    })
  }

  function payerOrange() {
    setError(null)
    startOrange(async () => {
      const res = await initierOrangeAnnonce(annonceId)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        setError(res.error ?? 'Impossible d\'initialiser le paiement Orange Money.')
      }
    })
  }

  return (
    <div className="paiement-card">
      <div className="paiement-annonce-info">
        <span className="paiement-label">Annonce à activer</span>
        <p className="paiement-titre-annonce">{titreCourt}</p>
      </div>

      <div className="paiement-montant-box">
        <span className="paiement-montant">1 500 FCFA</span>
        <span className="paiement-montant-desc">Activation annonce — paiement unique</span>
      </div>

      {error && <p className="paiement-error">❌ {error}</p>}

      <div className="paiement-methodes">
        <p className="paiement-methodes-titre">Choisissez votre mode de paiement</p>

        {/* Wave */}
        <button
          onClick={payerWave}
          disabled={pendingWave || pendingOrange}
          className="paiement-btn paiement-btn--wave"
        >
          {pendingWave ? (
            <span>Connexion Wave…</span>
          ) : (
            <>
              <span className="paiement-btn-logo">🌊</span>
              <div className="paiement-btn-text">
                <span className="paiement-btn-nom">Wave</span>
                <span className="paiement-btn-desc">Paiement mobile instantané</span>
              </div>
              <span className="paiement-btn-arrow">→</span>
            </>
          )}
        </button>

        {/* Orange Money */}
        <button
          onClick={payerOrange}
          disabled={pendingWave || pendingOrange}
          className="paiement-btn paiement-btn--orange"
        >
          {pendingOrange ? (
            <span>Connexion Orange Money…</span>
          ) : (
            <>
              <span className="paiement-btn-logo">🟠</span>
              <div className="paiement-btn-text">
                <span className="paiement-btn-nom">Orange Money</span>
                <span className="paiement-btn-desc">Paiement via votre compte Orange</span>
              </div>
              <span className="paiement-btn-arrow">→</span>
            </>
          )}
        </button>
      </div>

      <div className="paiement-garanties">
        <span>🔒 Paiement sécurisé</span>
        <span>✅ Activation immédiate</span>
        <span>📞 Support disponible</span>
      </div>
    </div>
  )
}
