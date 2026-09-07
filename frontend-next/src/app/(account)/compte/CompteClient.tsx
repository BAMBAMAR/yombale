'use client'

import { useState, useEffect } from 'react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/context'
// Sous-composants

// Sous-composants
import AnnoncesClient from '../mes-annonces/AnnoncesClient'
import AnnoncesImmoClient from './tabs/AnnoncesImmoClient'
import FavorisClient from '../favoris/FavorisClient'
import ProfilClient from '../compte/profil/ProfilClient'
import ApporteurClient from '../compte/apporteur/ApporteurClient'
import FonctionnalitesClient from '../compte/fonctionnalites/FonctionnalitesClient'
import SuiviCommandeClient from './tabs/SuiviCommandeClient'
import AlertesClientTab from './tabs/AlertesClientTab'
import AccountDashboardHub from './tabs/AccountDashboardHub'

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
  const rawTab = searchParams.get('tab')
  const isDashboard = !rawTab || rawTab === 'accueil' || rawTab === 'dashboard'
  const tab = isDashboard ? 'accueil' : rawTab
  const isOnline = useOnlineStatus()
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!isOnline)
  }, [isOnline])

  // Navigation par onglet
  useEffect(() => {
  }, [tab])

  // Préchargement global universel (Annonces, Immo, Plan, Boutiques & tout leur contenu)
  // Les routes /api/* de Next.js servent de proxy authentifié via la session serveur (JWT signé)
  useEffect(() => {
    if (!isOnline) {
      return
    }

    // Différer le préchargement de 1200ms pour laisser le ping prioritaire s'exécuter sans encombrement réseau
    const preloadTimer = setTimeout(() => {
      const fetchLow = (url: string) => fetch(url, { priority: 'low' } as any)

      // 1. Précharge les annonces classifiées
      fetchLow('/api/annonces/mine')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (d?.annonces) {
            localStorage.setItem(`nopalou_offline_annonces_${session?.userId}`, JSON.stringify(d.annonces))
          }
        })
        .catch(err => console.warn('[Compte SPA] ⚠️ Erreur préchargement annonces :', err))

      // 2. Précharge les annonces immo
      fetchLow('/api/immo/mine')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (Array.isArray(d)) {
            localStorage.setItem('nopalou_offline_immo_mine', JSON.stringify(d))
          }
        })
        .catch(err => console.warn('[Compte SPA] ⚠️ Erreur préchargement immo :', err))

      // 3. Précharge le plan d'abonnement actif
      fetchLow('/api/abonnements/mon-plan')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (d?.abonnement?.plan) {
            localStorage.setItem('nopalou_plan_actif', d.abonnement.plan)
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

          boutiquesList.forEach(async (b: any) => {
            // 4a. Catalogue produits
            fetchLow(`/api/boutiques/${b.id}/produits`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(pData => {
                const prods = pData.produits || (Array.isArray(pData) ? pData : [])
                localStorage.setItem(`nopalou_pos_produits_${b.id}`, JSON.stringify(prods))
              })
              .catch(() => console.warn(`[Compte SPA] ⚠️ Catalogue "${b.nom}" : erreur réseau (ignorée)`))

            // 4b. Historique caisse POS
            fetchLow(`/api/boutiques/${b.id}/pos-historique`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(hist => {
                if (Array.isArray(hist) && hist.length > 0) {
                  localStorage.setItem(`nopalou_pos_historique_${b.id}`, JSON.stringify(hist))
                }
              })
              .catch(() => {})

            // 4c. Clients & Crédits
            fetchLow(`/api/boutiques/${b.id}/credits-clients`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(cData => {
                if (cData?.clients && Array.isArray(cData.clients)) {
                  localStorage.setItem(`nopalou_offline_clients_${b.id}`, JSON.stringify(cData.clients))
                }
              })
              .catch(() => {})

            // 4d. Admins
            fetchLow(`/api/boutiques/${b.id}/admins`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.admins) {
                  localStorage.setItem(`nopalou_offline_admins_${b.id}`, JSON.stringify(data.admins))
                }
              })
              .catch(() => {})

            // 4e. Caissiers
            fetchLow(`/api/boutiques/${b.id}/caissiers`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.caissiers) {
                  localStorage.setItem(`nopalou_offline_caissiers_${b.id}`, JSON.stringify(data.caissiers))
                }
              })
              .catch(() => {})

            // 4f. Analytics
            fetchLow(`/api/analytics/boutique/${b.id}`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.stats) {
                  localStorage.setItem(`nopalou_offline_analytics_${b.id}`, JSON.stringify(data))
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

  const { t } = useTranslation()

  const handleNavigateTab = (tabKey: string) => {
    if (tabKey === 'accueil' || tabKey === 'dashboard') {
      router.push('/compte')
    } else {
      router.push(`/compte?tab=${tabKey}`)
    }
  }

  return (
    <>
      {isOffline && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, background: '#F59E0B', color: '#FFF', padding: '8px 16px', borderRadius: 8, zIndex: 9999, fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          📡 {t('common.offlineMode')}
        </div>
      )}

      <div style={{ padding: '20px' }}>
        {/* En-tête de retour au Dashboard si on est dans un sous-onglet */}
        {!isDashboard && (
          <div style={{ marginBottom: 18 }}>
            <button
              type="button"
              onClick={() => handleNavigateTab('accueil')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--navy, #1C2B4A)',
                background: '#ffffff',
                border: '1.5px solid var(--border, #E8DDD2)',
                padding: '7px 16px',
                borderRadius: 20,
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ color: 'var(--accent, #C75B00)', fontSize: 16 }}>←</span>
              <span>Tableau de bord</span>
            </button>
          </div>
        )}

        {isDashboard && (
          <AccountDashboardHub
            nom={nom}
            email={email}
            initiale={initiale}
            userId={userId}
            session={session}
            onNavigateTab={handleNavigateTab}
          />
        )}
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
        {tab === 'suivi-commande' && <SuiviCommandeClient />}
        {(tab === 'mes-alertes' || tab === 'alertes') && <AlertesClientTab userId={userId} />}
        {tab === 'favoris' && <FavorisClient />}
        {tab === 'profil' && <ProfilClient nom={nom} email={email || ''} />}
        {tab === 'apporteur' && <ApporteurClient />}
        {(tab === 'fonctionnalites' || tab === 'abonnement' || tab === 'tarifs') && <FonctionnalitesClient />}
      </div>
    </>
  )
}
