'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
// Sous-composants

// Sous-composants
import AnnoncesClient from '../mes-annonces/AnnoncesClient'
import AnnoncesImmoClient from './tabs/AnnoncesImmoClient'
import FavorisClient from '../favoris/FavorisClient'
import ProfilClient from '../compte/profil/ProfilClient'
import ApporteurClient from '../compte/apporteur/ApporteurClient'
import FonctionnalitesClient from '../compte/fonctionnalites/FonctionnalitesClient'

export default function CompteClient({ 
  nom, 
  email, 
  initiale, 
  session 
}: { 
  nom: string, 
  email: string | null, 
  initiale: string,
  session: any
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'mes-annonces'
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    console.info(`[Compte SPA] Statut Réseau initial : ${navigator.onLine ? '🟢 En Ligne' : '📡 Hors-Ligne'}`)

    const handleOnline = () => {
      console.info('[Compte SPA] Connexion rétablie 🟢 -> Mode En Ligne')
      setIsOffline(false)
    }
    const handleOffline = () => {
      console.warn('[Compte SPA] Perte de connexion réseau 📡 -> Activation du Mode Hors-Ligne')
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Log de navigation par onglet
  useEffect(() => {
    console.log(`[Compte SPA] Navigation vers l'onglet : "${tab}"`)
  }, [tab])

  // Préchargement global (Annonces, Immo, Boutiques & Catalogues)
  useEffect(() => {
    if (!navigator.onLine) {
      console.log('[Compte SPA] Hors-ligne : Préchargement arrière-plan ignoré (utilisation du cache existant)')
      return
    }
    console.log('[Compte SPA] Démarrage du préchargement global (Annonces, Immo, Boutiques & Catalogues)...')
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    const headers = token ? { Authorization: `Bearer ${token}` } : {}

    // 1. Précharge les annonces classifiées
    fetch('/api/annonces/mine', { headers })
      .then(r => r.json())
      .then(d => {
        if (d?.annonces) {
          localStorage.setItem(`nopalou_offline_annonces_${session?.userId}`, JSON.stringify(d.annonces))
          console.log(`[Compte SPA] ✅ ${d.annonces.length} annonces classifiées préchargées en cache.`)
        }
      })
      .catch(err => console.warn('[Compte SPA] Erreur préchargement annonces :', err))

    // 2. Précharge les annonces immo
    fetch('/api/immo/mine', { headers })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          localStorage.setItem('nopalou_offline_immo_mine', JSON.stringify(d))
          console.log(`[Compte SPA] ✅ ${d.length} biens immobiliers préchargés en cache.`)
        }
      })
      .catch(err => console.warn('[Compte SPA] Erreur préchargement immo :', err))

    // 3. Précharge les boutiques & leurs catalogues/caisse
    fetch('/api/boutiques/mine', { headers })
      .then(r => r.json())
      .then(d => {
        const boutiquesList = d?.boutiques || (Array.isArray(d) ? d : [])
        if (boutiquesList.length > 0) {
          localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify(boutiquesList))
          console.log(`[Compte SPA] ✅ ${boutiquesList.length} boutique(s) préchargée(s). Synchronisation des catalogues...`)

          boutiquesList.forEach(async (b: any) => {
            try {
              // Catalogue produits
              const resProds = await fetch(`/api/boutiques/${b.id}/produits`, { headers })
              if (resProds.ok) {
                const pData = await resProds.json()
                const prods = pData.produits || (Array.isArray(pData) ? pData : [])
                localStorage.setItem(`nopalou_pos_produits_${b.id}`, JSON.stringify(prods))
                console.log(`[Compte SPA] ✅ Catalogue Boutique "${b.nom}" (${prods.length} produits) préchargé.`)
              }

              // Historique caisse POS
              const resHist = await fetch(`/api/boutiques/${b.id}/pos-historique`, { headers })
              if (resHist.ok) {
                const hist = await resHist.json()
                if (Array.isArray(hist)) {
                  localStorage.setItem(`nopalou_pos_historique_${b.id}`, JSON.stringify(hist))
                }
              }

              // Clients & Crédits
              const resClients = await fetch(`/api/boutiques/${b.id}/credits-clients`, { headers })
              if (resClients.ok) {
                const cData = await resClients.json()
                if (cData.clients) {
                  localStorage.setItem(`nopalou_offline_clients_${b.id}`, JSON.stringify(cData.clients))
                }
              }
            } catch (e) {
              console.warn(`[Compte SPA] Erreur sync boutique ${b.id}:`, e)
            }
          })
        }
      })
      .catch(err => console.warn('[Compte SPA] Erreur préchargement boutiques :', err))
  }, [session?.userId])

  const userId = session?.userId || ''

  return (
    <>
      {isOffline && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#F59E0B', color: '#FFF', padding: '8px 16px', borderRadius: 8, zIndex: 9999, fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          📡 Mode Hors-Ligne
        </div>
      )}

      <div style={{ padding: '20px' }}>
        {tab === 'mes-annonces' && (
           <AnnoncesClient 
              created={false} 
              updated={false} 
              userId={userId} 
              prixAnnonce={1500} 
              prixBoost={500} 
              numeroWave="" 
              numeroOM="" 
              waveActif={true} 
           />
        )}
        {tab === 'mes-annonces-immo' && <AnnoncesImmoClient />}
        {tab === 'favoris' && <FavorisClient />}
        {tab === 'profil' && <ProfilClient nom={nom} email={email || ''} />}
        {tab === 'apporteur' && <ApporteurClient />}
        {tab === 'fonctionnalites' && <FonctionnalitesClient />}
      </div>
    </>
  )
}
