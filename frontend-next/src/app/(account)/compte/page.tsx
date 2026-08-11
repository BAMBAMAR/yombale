import type { Metadata } from 'next'
import { verifySession } from '@/lib/dal'
import CompteClient from './CompteClient'

export const metadata: Metadata = { title: 'Mon compte' }

export default async function ComptePage() {
  const session = await verifySession()
  const rawNom = session.nom?.trim()
  const emailVal = session.email?.trim()
  const nom = rawNom || emailVal || 'Vous'
  const initiale = nom.charAt(0).toUpperCase()

  return (
    <CompteClient 
      nom={nom} 
      email={emailVal || null} 
      initiale={initiale} 
      session={session} 
    />
  )
}
