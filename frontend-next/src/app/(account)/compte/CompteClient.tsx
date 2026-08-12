'use client'

import { useState, useEffect } from 'react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
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
  const isOnline = useOnlineStatus()
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!isOnline)
    console.info(`[Compte SPA] Statut Réseau : ${isOnline ? '🟢 En Ligne (ping confirmé)' : '📡 Hors-Ligne (ping échoué)'}`)
  }, [isOnline])

  // Log de navigation par onglet
  useEffect(() => {
    console.log(`[Compte SPA] Navigation vers l'onglet : "${tab}"`)
  }, [tab])

  // Préchargement global universel (Annonces, Immo, Plan, Boutiques & tout leur contenu)
  // Les routes /api/* de Next.js servent de proxy authentifié via la session serveur (JWT signé)
  useEffect(() => {
    if (!isOnline) {
      console.log('[Compte SPA] 📡 Hors-ligne : Préchargement arrière-plan ignoré (cache existant utilisé)')
      return
    }

    // Différer le préchargement de 1200ms pour laisser le ping prioritaire s'exécuter sans encombrement réseau
    const preloadTimer = setTimeout(() => {
      console.log('[Compte SPA] 🚀 Démarrage du préchargement global (Annonces, Immo, Plan, Boutiques & Catalogues)...')

      const fetchLow = (url: string) => fetch(url, { priority: 'low' } as any)

      // 1. Précharge les annonces classifiées
      fetchLow('/api/annonces/mine')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (d?.annonces) {
            localStorage.setItem(`nopalou_offline_annonces_${session?.userId}`, JSON.stringify(d.annonces))
            console.log(`[Compte SPA] ✅ ${d.annonces.length} annonces classifiées préchargées en cache.`)
          }
        })
        .catch(err => console.warn('[Compte SPA] ⚠️ Erreur préchargement annonces :', err))

      // 2. Précharge les annonces immo
      fetchLow('/api/immo/mine')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (Array.isArray(d)) {
            localStorage.setItem('nopalou_offline_immo_mine', JSON.stringify(d))
            console.log(`[Compte SPA] ✅ ${d.length} biens immobiliers préchargés en cache.`)
          }
        })
        .catch(err => console.warn('[Compte SPA] ⚠️ Erreur préchargement immo :', err))

      // 3. Précharge le plan d'abonnement actif
      fetchLow('/api/abonnements/mon-plan')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (d?.abonnement?.plan) {
            localStorage.setItem('nopalou_plan_actif', d.abonnement.plan)
            console.log(`[Compte SPA] ✅ Plan actif "${d.abonnement.plan}" sauvegardé en cache.`)
          }
        })
        .catch(err => console.warn('[Compte SPA] ⚠️ Erreur préchargement plan :', err))

      // 4. Précharge les boutiques & tout leur contenu (catalogues, caisse, clients, equipe, analytics)
      fetchLow('/api/boutiques/mine')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          const boutiquesList = d?.boutiques || (Array.isArray(d) ? d : [])
          if (boutiquesList.length === 0) return
          localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify(boutiquesList))
          console.log(`[Compte SPA] ✅ ${boutiquesList.length} boutique(s) préchargée(s). Synchronisation des catalogues...`)

          boutiquesList.forEach(async (b: any) => {
            // 4a. Catalogue produits
            fetchLow(`/api/boutiques/${b.id}/produits`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(pData => {
                const prods = pData.produits || (Array.isArray(pData) ? pData : [])
                localStorage.setItem(`nopalou_pos_produits_${b.id}`, JSON.stringify(prods))
                console.log(`[Compte SPA] ✅ Catalogue Boutique "${b.nom}" (${prods.length} produits) préchargé.`)
              })
              .catch(() => console.warn(`[Compte SPA] ⚠️ Catalogue "${b.nom}" : erreur réseau (ignorée)`))

            // 4b. Historique caisse POS
            fetchLow(`/api/boutiques/${b.id}/pos-historique`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(hist => {
                if (Array.isArray(hist) && hist.length > 0) {
                  localStorage.setItem(`nopalou_pos_historique_${b.id}`, JSON.stringify(hist))
                  console.log(`[Compte SPA] ✅ Historique caisse "${b.nom}" (${hist.length} ventes) préchargé.`)
                }
              })
              .catch(() => {})

            // 4c. Clients & Crédits
            fetchLow(`/api/boutiques/${b.id}/credits-clients`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(cData => {
                if (cData?.clients && Array.isArray(cData.clients)) {
                  localStorage.setItem(`nopalou_offline_clients_${b.id}`, JSON.stringify(cData.clients))
                  console.log(`[Compte SPA] ✅ Clients "${b.nom}" (${cData.clients.length}) préchargés.`)
                }
              })
              .catch(() => {})

            // 4d. Admins
            fetchLow(`/api/boutiques/${b.id}/admins`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.admins) {
                  localStorage.setItem(`nopalou_offline_admins_${b.id}`, JSON.stringify(data.admins))
                  console.log(`[Compte SPA] ✅ Admins "${b.nom}" (${data.admins.length}) préchargés.`)
                }
              })
              .catch(() => {})

            // 4e. Caissiers
            fetchLow(`/api/boutiques/${b.id}/caissiers`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.caissiers) {
                  localStorage.setItem(`nopalou_offline_caissiers_${b.id}`, JSON.stringify(data.caissiers))
                  console.log(`[Compte SPA] ✅ Caissiers "${b.nom}" (${data.caissiers.length}) préchargés.`)
                }
              })
              .catch(() => {})

            // 4f. Analytics
            fetchLow(`/api/analytics/boutique/${b.id}`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.stats) {
                  localStorage.setItem(`nopalou_offline_analytics_${b.id}`, JSON.stringify(data))
                  console.log(`[Compte SPA] ✅ Analytics "${b.nom}" préchargés.`)
                }
              })
              .catch(() => {})
          })
        })
        .catch(err => console.warn('[Compte SPA] ⚠️ Erreur préchargement boutiques :', err))
    }, 1200)

    return () => clearTimeout(preloadTimer)
  }, [isOnline, session?.userId])

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
