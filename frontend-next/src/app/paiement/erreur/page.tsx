import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Paiement échoué',
}

export default function PaiementErreurPage() {
  return (
    <div className="page-container" style={{ paddingTop: '4rem', maxWidth: 560 }}>
      <div className="paiement-succes-page">
        <div className="paiement-succes-icon" style={{ background: '#FEF2F2' }}>❌</div>
        <h1 className="paiement-succes-titre" style={{ color: 'var(--red)' }}>
          Paiement annulé
        </h1>
        <p className="paiement-succes-desc">
          Votre paiement n&apos;a pas abouti. Votre annonce n&apos;a pas été activée.
          Aucun montant n&apos;a été débité.
        </p>

        <div className="paiement-succes-actions">
          <Link href="/mes-annonces" className="paiement-cta-btn">
            Retenter le paiement
          </Link>
          <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
