import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Paiement réussi',
}

type PayType = 'annonce' | 'immo-sponsoring' | 'boutique-sponsoring' | string

function getContent(type: PayType, ref: string) {
  switch (type) {
    case 'annonce':
      return {
        desc: 'Votre annonce a été activée et est maintenant visible par tous les visiteurs.',
        actions: (
          <>
            <Link href="/mes-annonces" className="paiement-cta-btn">Voir mes annonces</Link>
            <Link href="/deposer-annonce" className="paiement-cta-btn paiement-cta-btn--outline">Publier une autre annonce</Link>
          </>
        ),
      }
    case 'immo-sponsoring':
      return {
        desc: 'Votre annonce immobilière est maintenant mise en avant pendant 30 jours. Elle apparaît en tête des résultats.',
        actions: (
          <>
            <Link href="/mes-annonces-immo" className="paiement-cta-btn">Voir mes annonces immo</Link>
            <Link href={`/immo/${ref}`} className="paiement-cta-btn paiement-cta-btn--outline">Voir l&apos;annonce</Link>
          </>
        ),
      }
    case 'boutique-sponsoring':
      return {
        desc: 'Votre boutique est maintenant mise en avant pendant 30 jours. Elle apparaît en tête de la liste des boutiques.',
        actions: (
          <>
            <Link href="/boutique" className="paiement-cta-btn">Gérer ma boutique</Link>
            <Link href="/boutiques" className="paiement-cta-btn paiement-cta-btn--outline">Voir la liste des boutiques</Link>
          </>
        ),
      }
    default:
      return {
        desc: 'Votre paiement a bien été reçu. Merci pour votre confiance.',
        actions: <Link href="/" className="paiement-cta-btn">Retour à l&apos;accueil</Link>,
      }
  }
}

export default function PaiementSuccesPage({
  searchParams,
}: {
  searchParams: { ref?: string; type?: string; methode?: string }
}) {
  const type    = searchParams.type ?? 'annonce'
  const ref     = searchParams.ref  ?? ''
  const methode = searchParams.methode === 'orange' ? ' via Orange Money' : ''
  const { desc, actions } = getContent(type, ref)

  return (
    <div className="page-container" style={{ paddingTop: '4rem', maxWidth: 560 }}>
      <div className="paiement-succes-page">
        <div className="paiement-succes-icon">✅</div>
        <h1 className="paiement-succes-titre">Paiement confirmé{methode} !</h1>
        <p className="paiement-succes-desc">{desc}</p>
        {ref && (
          <p className="paiement-ref">Référence : <code>{ref}</code></p>
        )}
        <div className="paiement-succes-actions">{actions}</div>
      </div>
    </div>
  )
}
