import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Paiement réussi — Nopalou',
}

export default function PaiementSuccesPage({
  searchParams,
}: {
  searchParams: { ref?: string; type?: string }
}) {
  const isAnnonce = searchParams.type === 'annonce'

  return (
    <div className="page-container" style={{ paddingTop: '4rem', maxWidth: 560 }}>
      <div className="paiement-succes-page">
        <div className="paiement-succes-icon">✅</div>
        <h1 className="paiement-succes-titre">Paiement confirmé !</h1>
        <p className="paiement-succes-desc">
          {isAnnonce
            ? 'Votre annonce a été activée et est maintenant visible par tous les visiteurs.'
            : 'Votre paiement a bien été reçu. Merci pour votre confiance.'}
        </p>

        {searchParams.ref && (
          <p className="paiement-ref">
            Référence : <code>{searchParams.ref}</code>
          </p>
        )}

        <div className="paiement-succes-actions">
          {isAnnonce ? (
            <>
              <Link href="/mes-annonces" className="paiement-cta-btn">
                Voir mes annonces
              </Link>
              <Link href="/deposer-annonce" className="paiement-cta-btn paiement-cta-btn--outline">
                Déposer une autre annonce
              </Link>
            </>
          ) : (
            <Link href="/" className="paiement-cta-btn">
              Retour à l&apos;accueil
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
