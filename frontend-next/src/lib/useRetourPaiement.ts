'use client'

import { useEffect, useRef } from 'react'

// Retour de la passerelle Wave : Wave renvoie le client sur /surga?paiement=succes|erreur&ref=…
// - erreur : paiement non abouti (solde insuffisant, annulation) : message clair, rien n'a été débité, l'offre se rouvre ;
// - succes : l'abonnement est vérifié auprès de Wave (le webhook peut arriver quelques secondes après le retour).
// Les paramètres sont retirés de l'adresse dès leur lecture pour ne pas rejouer le message au rechargement.

interface Options {
  onActif: () => void
  onEchec: () => void
}

const MESSAGE_ECHEC =
  'Le paiement Wave n’a pas abouti : solde insuffisant ou paiement annulé. Rien n’a été débité. Rechargez votre compte Wave puis réessayez.'

function annoncer(message: string, type: 'succes' | 'info', duree = 6500) {
  try { window.dispatchEvent(new CustomEvent('surga-toast', { detail: { message, type, duree } })) } catch {}
}

export function useRetourPaiement({ onActif, onEchec }: Options) {
  const rappels = useRef({ onActif, onEchec })
  rappels.current = { onActif, onEchec }
  const traite = useRef(false)

  useEffect(() => {
    if (traite.current) return
    traite.current = true
    let statut: string | null = null
    let reference: string | null = null
    try {
      const url = new URL(window.location.href)
      statut = url.searchParams.get('paiement')
      reference = url.searchParams.get('ref')
      if (!statut) return
      url.searchParams.delete('paiement')
      url.searchParams.delete('ref')
      window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
    } catch { return }

    if (statut === 'erreur') {
      annoncer(MESSAGE_ECHEC, 'info', 9000)
      rappels.current.onEchec()
      return
    }
    if (statut !== 'succes' || !reference) return

    const verifier = async (essai: number) => {
      try {
        const res = await fetch('/api/surga/abonnements/verifier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.success) {
          annoncer('Paiement reçu : votre abonnement Surga est activé.', 'succes'); rappels.current.onActif()
          return
        }
      } catch { /* réseau : on retente */ }
      if (essai < 4) { setTimeout(() => verifier(essai + 1), 4000); return }
      annoncer('Paiement en cours de confirmation par Wave. Votre abonnement s’activera dans quelques minutes ; rouvrez Surga pour vérifier.', 'info', 9000)
    }
    verifier(0)
  }, [])
}
