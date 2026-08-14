import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Paiement non abouti',
}

type PayType = 'commande-express' | 'commande-boutique' | 'annonce' | 'immo-sponsoring' | 'boutique-sponsoring' | 'abonnement' | string

function getErreurContent(type: PayType, ref: string) {
  switch (type) {
    case 'commande-express':
    case 'commande-boutique':
      return {
        titre: 'Paiement de la commande non abouti',
        desc: 'Votre paiement Wave n\'a pas pu aboutir (annulation ou solde insuffisant). Votre commande est enregistrée en attente et aucun montant n\'a été débité.',
        actions: (
          <>
            <Link href="/boutiques" className="paiement-cta-btn">Parcourir les boutiques</Link>
            <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">Accueil</Link>
          </>
        ),
      }
    case 'abonnement':
      return {
        titre: 'Paiement de l\'abonnement non abouti',
        desc: 'Le paiement de votre abonnement boutique n\'a pas pu être finalisé. Aucun montant n\'a été débité.',
        actions: (
          <>
            <Link href="/boutique" className="paiement-cta-btn">Mon espace boutique</Link>
            <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">Accueil</Link>
          </>
        ),
      }
    case 'boutique-sponsoring':
      return {
        titre: 'Paiement du sponsoring non abouti',
        desc: 'Le paiement pour la mise en avant de votre boutique n\'a pas abouti. Aucun montant n\'a été débité.',
        actions: (
          <>
            <Link href="/boutique" className="paiement-cta-btn">Ma boutique</Link>
            <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">Accueil</Link>
          </>
        ),
      }
    case 'immo-sponsoring':
      return {
        titre: 'Paiement du sponsoring immo non abouti',
        desc: 'Le paiement de la mise en avant de votre annonce immobilière n\'a pas abouti. Aucun montant n\'a été débité.',
        actions: (
          <>
            <Link href="/mes-annonces-immo" className="paiement-cta-btn">Mes annonces immo</Link>
            <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">Accueil</Link>
          </>
        ),
      }
    case 'produit-sponsoring':
      return {
        titre: 'Paiement du sponsoring produit non abouti',
        desc: 'Le paiement pour la mise en avant de votre produit n\'a pas abouti. Aucun montant n\'a été débité.',
        actions: (
          <>
            <Link href="/boutique" className="paiement-cta-btn">Ma boutique</Link>
            <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">Accueil</Link>
          </>
        ),
      }
    case 'annonce':
    case 'boost':
      return {
        titre: 'Paiement d\'annonce non abouti',
        desc: 'Votre paiement n\'a pas abouti. Votre annonce n\'a pas été activée. Aucun montant n\'a été débité.',
        actions: (
          <>
            <Link href="/mes-annonces" className="paiement-cta-btn">Mes annonces</Link>
            <Link href="/" className="paiement-cta-btn paiement-cta-btn--outline">Accueil</Link>
          </>
        ),
      }
    default:
      return {
        titre: 'Paiement non abouti',
        desc: 'Votre paiement n\'a pas pu être finalisé (annulation ou solde insuffisant). Aucun montant n\'a été débité.',
        actions: (
          <>
            <Link href="/" className="paiement-cta-btn">Retour à l&apos;accueil</Link>
          </>
        ),
      }
  }
}

export default function PaiementErreurPage({
  searchParams,
}: {
  searchParams: { ref?: string; type?: string }
}) {
  const ref  = searchParams.ref  ?? ''
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
    } else if (ref.startsWith('ann_') || ref.startsWith('boost_')) {
      type = 'annonce'
    }
  }

  const { titre, desc, actions } = getErreurContent(type || 'general', ref)

  return (
    <div className="page-container" style={{ paddingTop: '4rem', maxWidth: 560 }}>
      <div className="paiement-succes-page">
        <div className="paiement-succes-icon" style={{ background: '#FEF2F2' }}>❌</div>
        <h1 className="paiement-succes-titre" style={{ color: 'var(--red)' }}>
          {titre}
        </h1>
        <p className="paiement-succes-desc">
          {desc}
        </p>

        {ref && (
          <p className="paiement-ref">Référence : <code>{ref}</code></p>
        )}

        <div className="paiement-succes-actions">{actions}</div>
      </div>
    </div>
  )
}
