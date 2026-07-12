import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Retour paiement',
  robots: { index: false },
}

export default function RetourPaiementPage({
  searchParams,
}: {
  searchParams: { status?: string; order_id?: string; token?: string }
}) {
  const status   = searchParams.status ?? ''
  const orderId  = searchParams.order_id ?? ''

  // Si succès Orange Money → redirect vers page succès unifiée
  if (status === 'SUCCESS') {
    const type = orderId.startsWith('immo_')
      ? 'immo-sponsoring'
      : orderId.startsWith('bout_')
      ? 'boutique-sponsoring'
      : 'annonce'
    const ref  = orderId.split('_').slice(2).join('_') || orderId
    redirect(`/paiement/succes?ref=${ref}&type=${type}&methode=orange`)
  }

  // Echec ou retour manuel
  return (
    <div className="page-container" style={{ paddingTop: '4rem', maxWidth: 560 }}>
      <div className="paiement-succes-page">
        <div className="paiement-succes-icon" style={{ background: '#FEF2F2' }}>❌</div>
        <h1 className="paiement-succes-titre" style={{ color: 'var(--red)' }}>
          Paiement non complété
        </h1>
        <p className="paiement-succes-desc">
          Votre paiement Orange Money n&apos;a pas abouti ou a été annulé.
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
