'use client'
import { useState, useTransition } from 'react'
import { initierWaveAnnonce, initierOrangeAnnonce } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'

interface Props {
  annonceId: string
  titreCourt: string
  settings: Record<string, string>
  userId: string
}

export default function PaiementClient({ annonceId, titreCourt, settings, userId }: Props) {
  const [error, setError]                     = useState<string | null>(null)
  const [pendingWave, startWave]             = useTransition()
  const [pendingOrange, startOrange]         = useTransition()
  const [showManuel, setShowManuel]           = useState(false)

  const waveActif    = settings.paiement_wave !== 'false'
  const orangeActif  = settings.paiement_orange !== 'false'
  const manuelActif  = settings.paiement_manuel_actif !== 'false'
  const montant      = Number(settings.prix_annonce) || 1500

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
        <span className="paiement-montant">{montant.toLocaleString('fr-FR')} FCFA</span>
        <span className="paiement-montant-desc">Activation annonce — paiement unique</span>
      </div>

      {error && <p className="paiement-error">❌ {error}</p>}

      <div className="paiement-methodes">
        <p className="paiement-methodes-titre">Choisissez votre mode de paiement</p>

        {waveActif && (
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
        )}

        {orangeActif && (
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
        )}

        {manuelActif && (
          <button onClick={() => setShowManuel(true)} className="paiement-btn">
            <span className="paiement-btn-logo">🧾</span>
            <div className="paiement-btn-text">
              <span className="paiement-btn-nom">J&apos;ai déjà payé / Payer sans app</span>
              <span className="paiement-btn-desc">Dépôt manuel Wave/Orange, validé par notre équipe</span>
            </div>
            <span className="paiement-btn-arrow">→</span>
          </button>
        )}
      </div>

      <div className="paiement-garanties">
        <span>🔒 Paiement sécurisé</span>
        <span>✅ Activation immédiate</span>
        <span>📞 Support disponible</span>
      </div>

      {showManuel && (
        <ModalPaiementManuel
          reference={`ann_${userId}_${annonceId}`}
          montant={montant}
          numeroWave={settings.paiement_manuel_numero_wave || ''}
          numeroOM={settings.paiement_manuel_numero_om || ''}
          onClose={() => setShowManuel(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </div>
  )
}
