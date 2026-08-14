'use client'
import { useState, useTransition } from 'react'
import { initierWaveProduitSponsoring } from '@/app/actions/paiement'
import ModalPaiementManuel from '@/components/ModalPaiementManuel'

interface Props {
  produitId: string
  nomCourt: string
  settings: Record<string, string>
  userId: string
}

export default function PaiementSponsoringProduitClient({ produitId, nomCourt, settings, userId }: Props) {
  const [error, setError]                     = useState<string | null>(null)
  const [pendingWave, startWave]             = useTransition()
  const [showManuel, setShowManuel]           = useState(false)

  // Force l'activation de Wave
  const waveActif    = true
  const manuelActif  = settings.paiement_manuel_actif !== 'false'
  const montant      = Number(settings.prix_sponsoring) || 5000

  function payerWave() {
    setError(null)
    startWave(async () => {
      const res = await initierWaveProduitSponsoring(produitId)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        setError(res.error ?? 'L\'initialisation Wave à échoué. Réglez par dépôt manuel ci-dessous.')
        setShowManuel(true)
      }
    })
  }

  return (
    <div className="paiement-card">
      <div className="paiement-annonce-info">
        <span className="paiement-label">Produit à sponsoriser</span>
        <p className="paiement-titre-annonce">{nomCourt}</p>
      </div>

      <div className="paiement-montant-box">
        <span className="paiement-montant">{montant.toLocaleString('fr-FR')} FCFA</span>
        <span className="paiement-montant-desc">Sponsoring (30 jours)</span>
      </div>

      {error && <p className="paiement-error">❌ {error}</p>}

      <div className="paiement-methodes">
        <p className="paiement-methodes-titre">Choisissez votre mode de paiement</p>

        {waveActif && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: 4, width: 'fit-content' }}>
              ⚡ Recommandé — Activation automatique instantanée
            </span>
            <button
              onClick={payerWave}
              disabled={pendingWave}
              className="paiement-btn paiement-btn--wave"
              style={{ border: '2px solid #1d4ed8', boxShadow: '0 4px 12px rgba(29,78,216,0.15)' }}
            >
              {pendingWave ? (
                <span>Connexion à Wave…</span>
              ) : (
                <>
                  <span className="paiement-btn-logo">🌊</span>
                  <div className="paiement-btn-text">
                    <span className="paiement-btn-nom" style={{ fontWeight: 700 }}>Wave (Paiement Direct)</span>
                    <span className="paiement-btn-desc">Paiement 100% sécurisé et validation immédiate</span>
                  </div>
                  <span className="paiement-btn-arrow">→</span>
                </>
              )}
            </button>
          </div>
        )}

        <button
          disabled={true}
          className="paiement-btn paiement-btn--orange"
          style={{ opacity: 0.65, cursor: 'not-allowed', background: '#f8fafc', borderColor: '#cbd5e1' }}
        >
          <span className="paiement-btn-logo">🟠</span>
          <div className="paiement-btn-text">
            <span className="paiement-btn-nom">Orange Money <small style={{ color: '#ea580c', fontWeight: 700, marginLeft: 6 }}>(Bientôt disponible)</small></span>
            <span className="paiement-btn-desc">Intégration API automatique en cours</span>
          </div>
        </button>

        {manuelActif && (
          <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px dashed #cbd5e1' }}>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>Problème avec Wave ou vous préférez un dépôt manuel ?</p>
            <button onClick={() => setShowManuel(true)} className="paiement-btn" style={{ background: '#fff', border: '1px solid #94a3b8' }}>
              <span className="paiement-btn-logo">🧾</span>
              <div className="paiement-btn-text">
                <span className="paiement-btn-nom">Paiement Manuel / Reçu de Dépôt</span>
                <span className="paiement-btn-desc">Envoyer la preuve de transfert Wave / Orange Money</span>
              </div>
              <span className="paiement-btn-arrow">→</span>
            </button>
          </div>
        )}
      </div>

      <div className="paiement-garanties">
        <span>🔒 Paiement sécurisé</span>
        <span>✅ Sponsoring immédiat</span>
        <span>📞 Support disponible</span>
      </div>

      {showManuel && (
        <ModalPaiementManuel
          reference={`prod_${userId}_${produitId}`}
          montant={montant}
          numeroWave={settings.paiement_manuel_numero_wave || ''}
          numeroOM={settings.paiement_manuel_numero_om || ''}
          onClose={() => setShowManuel(false)}
          onSuccess={() => window.location.assign(`/produit/${produitId}`)}
        />
      )}
    </div>
  )
}
