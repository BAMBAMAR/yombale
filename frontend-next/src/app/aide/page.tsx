import { Suspense } from 'react'
import { Metadata } from 'next'
import AideClient from './AideClient'

export const metadata: Metadata = {
  title: "Centre d'Aide & Support — Nopalou Sénégal",
  description: "Guides pratiques, foire aux questions et assistance officielle pour gérer votre boutique en ligne, caisse POS et paiements au Sénégal.",
}

export default function AidePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
      <AideClient />
    </Suspense>
  )
}
