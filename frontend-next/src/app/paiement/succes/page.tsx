import type { Metadata } from 'next'
import Link from 'next/link'
import { ConfirmerSuccesEffect } from './ConfirmerSuccesEffect'

export const metadata: Metadata = {
  title: 'Paiement réussi',
}

type PayType =
  | 'commande-express'
  | 'commande-boutique'
  | 'abonnement'
  | 'boutique-sponsoring'
  | 'immo-sponsoring'
  | 'produit-sponsoring'
  | 'boost'
  | 'annonce'
  | string

function getContent(type: PayType, ref: string) {
  switch (type) {
    case 'commande-express':
    case 'commande-boutique':
      return {
        desc: 'Votre commande a été confirmée et réglée avec succès. Le vendeur prépare dès à présent votre livraison.',
        actions: (
          <>
            <Link href={ref ? `/suivi-commande?ref=${ref}` : '/boutiques'} className="paiement-cta-btn">Suivre ma commande</Link>
            <Link href="/boutiques" className="paiement-cta-btn paiement-cta-btn--outline">Parcourir les boutiques</Link>
          </>
        ),
      }
    case 'abonnement':
      return {
        desc: 'Votre abonnement boutique a été activé avec succès. Vous bénéficiez désormais de l\'ensemble des fonctionnalités de votre plan.',
        actions: (
          <>
            <Link href="/boutique" className="paiement-cta-btn">Mon espace boutique</Link>
            <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">Accueil</Link>
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
    case 'produit-sponsoring':
      return {
        desc: 'Votre produit est maintenant sponsorisé pendant 30 jours. Il sera mis en avant auprès de tous les acheteurs.',
        actions: (
          <>
            <Link href="/boutique" className="paiement-cta-btn">Ma boutique</Link>
            <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">Accueil</Link>
          </>
        ),
      }
    case 'boost':
      return {
        desc: 'Votre annonce a été boostée pour 7 jours. Elle sera remontée en tête des résultats.',
        actions: (
          <>
            <Link href="/mes-annonces" className="paiement-cta-btn">Voir mes annonces</Link>
            <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">Accueil</Link>
          </>
        ),
      }
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
  const ref  = searchParams.ref ?? ''
  let type   = searchParams.type

  // Si le paramètre `type` n'est pas fourni, déduire le type selon le préfixe de la référence
  if (!type && ref) {
    if (ref.startsWith('CMD-') || ref.startsWith('cmd_') || ref.startsWith('pm_')) {
      type = 'commande-express'
    } else if (ref.startsWith('abmt_')) {
      type = 'abonnement'
    } else if (ref.startsWith('bout_')) {
      type = 'boutique-sponsoring'
    } else if (ref.startsWith('immo_')) {
      type = 'immo-sponsoring'
    } else if (ref.startsWith('prod_')) {
      type = 'produit-sponsoring'
    } else if (ref.startsWith('boost_')) {
      type = 'boost'
    } else if (ref.startsWith('ann_')) {
      type = 'annonce'
    }
  }

  const methode = searchParams.methode === 'orange' ? ' via Orange Money' : ''
  const { desc, actions } = getContent(type || 'general', ref)

  return (
    <div className="page-container" style={{ paddingTop: '4rem', maxWidth: 560 }}>
      <ConfirmerSuccesEffect reference={ref} />
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
