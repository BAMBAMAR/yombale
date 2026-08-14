import type { Metadata } from 'next'
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

  let type = 'annonce'
  if (orderId.startsWith('CMD-') || orderId.startsWith('cmd_') || orderId.startsWith('pm_')) {
    type = 'commande-express'
  } else if (orderId.startsWith('abmt_')) {
    type = 'abonnement'
  } else if (orderId.startsWith('bout_')) {
    type = 'boutique-sponsoring'
  } else if (orderId.startsWith('immo_')) {
    type = 'immo-sponsoring'
  } else if (orderId.startsWith('prod_')) {
    type = 'produit-sponsoring'
  } else if (orderId.startsWith('boost_')) {
    type = 'boost'
  } else if (orderId.startsWith('ann_')) {
    type = 'annonce'
  }

  // Si succès Orange Money → redirect vers page succès unifiée
  if (status === 'SUCCESS') {
    redirect(`/paiement/succes?ref=${encodeURIComponent(orderId)}&type=${type}&methode=orange`)
  }

  // En cas d'échec ou d'annulation → redirect vers page d'erreur unifiée
  redirect(`/paiement/erreur?ref=${encodeURIComponent(orderId)}&type=${type}`)
}
