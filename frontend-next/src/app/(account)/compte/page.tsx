import type { Metadata } from 'next'
import { verifySession } from '@/lib/dal'
import { backendFetch } from '@/lib/backend-fetch'
import CompteClient from './CompteClient'

export const metadata: Metadata = { title: 'Mon compte' }

export default async function ComptePage() {
  const session = await verifySession()
  let rawNom = session.nom?.trim()
  let emailVal = session.email?.trim()
  let telephoneVal = session.telephone?.trim()

  // Tenter de récupérer les données les plus fraîches depuis la base de données
  try {
    const res = await backendFetch('/api/auth/profil')
    if (res.ok) {
      const data = await res.json()
      if (data?.user) {
        if (data.user.nom) rawNom = data.user.nom.trim()
        if (data.user.email) emailVal = data.user.email.trim()
        if (data.user.telephone) telephoneVal = data.user.telephone.trim()
      }
    }
  } catch (err) {
    console.warn('[ComptePage] Erreur récupération profil DB :', err)
  }

  const nom = rawNom || emailVal || 'Vous'
  const initiale = nom.charAt(0).toUpperCase()

  return (
    <CompteClient 
      nom={nom} 
      email={emailVal || null} 
      telephone={telephoneVal || null}
      initiale={initiale} 
      session={{ ...session, nom, email: emailVal, telephone: telephoneVal }} 
    />
  )
}
