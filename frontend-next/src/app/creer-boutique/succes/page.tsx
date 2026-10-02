'use client'

// AUD-213 : écran de succès de la création de boutique, servi par une vraie route.
// Avant, le succès était un état local du wizard : l'ouverture de la session (cookie posé par une Server Action)
// réinitialisait la page et le vendeur retombait sur l'étape 1 sans rien voir. Ici tout vient de l'adresse.
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import ModalBoutiqueCreeeSucces from '../components/ModalBoutiqueCreeeSucces'

function Succes() {
  const router = useRouter()
  const params = useSearchParams()
  const id = params?.get('id') || ''
  const nom = params?.get('nom') || ''
  const slug = params?.get('slug') || null
  const tel = params?.get('tel') || ''
  const sessionNonOuverte = params?.get('session') === '0'
  const valide = /^[0-9a-f-]{8,40}$/i.test(id) && nom.trim().length > 0

  useEffect(() => {
    if (!valide) router.replace('/creer-boutique')
  }, [valide, router])

  if (!valide) return null
  return (
    <ModalBoutiqueCreeeSucces
      asPage
      nom={nom}
      boutiqueId={id}
      slug={slug}
      telephone={tel}
      sessionNonOuverte={sessionNonOuverte}
    />
  )
}

export default function CreerBoutiqueSuccesPage() {
  return (
    <Suspense fallback={null}>
      <Succes />
    </Suspense>
  )
}
