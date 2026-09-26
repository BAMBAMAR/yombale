'use client'

import { useState, useEffect } from 'react'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTranslation } from '@/i18n/context'
import { Tag, Home, Package, Bell, Heart, User, Users, Sparkles } from 'lucide-react'

// Sous-composants
import AnnoncesClient from '../mes-annonces/AnnoncesClient'
import AnnoncesImmoClient from './tabs/AnnoncesImmoClient'
import FavorisClient from '../favoris/FavorisClient'
import ProfilClient from '../compte/profil/ProfilClient'
import ApporteurClient from '../compte/apporteur/ApporteurClient'
import FonctionnalitesClient from '../compte/fonctionnalites/FonctionnalitesClient'
import SuiviCommandeClient from './tabs/SuiviCommandeClient'
import AlertesClientTab from './tabs/AlertesClientTab'
import MesLocationsClient from './tabs/MesLocationsClient'
import AccountDashboardHub from './tabs/AccountDashboardHub'
import AccountSubHeader from '../components/AccountSubHeader'
import { Building2 } from 'lucide-react'
import { SamaKalpeClient } from './kalpe/SamaKalpeClient'

export default function CompteClient({ 
  nom, 
  email, 
  telephone,
  initiale, 
  session 
}: { 
  nom: string, 
  email: string | null, 
  telephone?: string | null,
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

  // Préchargement global universel (Boutiques, Agences, Tableaux de bord, Menus & Tabs)
  // Permet une autonomie complète sans internet avec les dernières données chargées
  useEffect(() => {
    if (!isOnline) {
      return
    }

    const preloadTimer = setTimeout(() => {
      const fetchLow = (url: string) => fetch(url, { priority: 'low' } as any)
      const currentUid = session?.userId || (session as any)?.id || ''

      // 1. Précharge les annonces classifiées
      fetchLow('/api/annonces/mine')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (d?.annonces) {
            localStorage.setItem(`nopalou_offline_annonces_${currentUid}`, JSON.stringify(d.annonces))
          }
        })
        .catch(() => {})

      // 2. Précharge les annonces immo
      fetchLow('/api/immo/mine')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (Array.isArray(d)) {
            const key = currentUid ? `nopalou_offline_immo_mine_${currentUid}` : 'nopalou_offline_immo_mine'
            localStorage.setItem(key, JSON.stringify(d))
          }
        })
        .catch(() => {})

      // 3. Précharge le plan d'abonnement actif
      fetchLow('/api/abonnements/mon-plan')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (d?.abonnement) {
            const p = d.abonnement.is_trial ? 'business' : (d.abonnement.plan_effectif || d.abonnement.plan)
            if (p) localStorage.setItem('nopalou_plan_actif', p)
            localStorage.setItem('nopalou_offline_abonnement', JSON.stringify(d.abonnement))
          }
        })
        .catch(() => {})

      // 4. Précharge TOUTES les boutiques & l'ensemble de leurs modules et tableaux de bord
      fetchLow('/api/boutiques/mine')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          const boutiquesList = d?.boutiques || (Array.isArray(d) ? d : [])
          if (boutiquesList.length === 0) return
          localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify(boutiquesList))
          if (boutiquesList[0]?.plan_actif && !localStorage.getItem('nopalou_plan_actif')) {
            localStorage.setItem('nopalou_plan_actif', boutiquesList[0].plan_actif)
          }

          import('@/lib/db-offline').then(({ sauvegarderBoutiquesLocales }) => {
            sauvegarderBoutiquesLocales(boutiquesList, currentUid).catch(() => {})
          }).catch(() => {})

          boutiquesList.forEach(async (b: any) => {
            // 4a. Catalogue produits & stocks (localStorage + IndexedDB)
            fetchLow(`/api/boutiques/${b.id}/produits`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(pData => {
                const prods = pData.produits || (Array.isArray(pData) ? pData : [])
                localStorage.setItem(`nopalou_pos_produits_${b.id}`, JSON.stringify(prods))
                localStorage.setItem(`nopalou_offline_prods_${b.id}`, JSON.stringify(prods))
                import('@/lib/db-offline').then(({ sauvegarderProduitsLocaux }) => {
                  sauvegarderProduitsLocaux(prods, b.id, currentUid).catch(() => {})
                }).catch(() => {})

                // Mise à jour synchrone des compteurs du dashboard
                try {
                  const count = prods.length
                  const alerts = prods.filter(
                    (p: any) => !p.en_stock || Number(p.quantite_stock ?? p.stock_quantite ?? p.stock ?? 10) <= 3
                  ).length
                  const prevKey = `nopalou_offline_dash_counts_${b.id}`
                  const existingStr = localStorage.getItem(prevKey)
                  let existing: any = {}
                  if (existingStr) try { existing = JSON.parse(existingStr) } catch (_) {}
                  localStorage.setItem(prevKey, JSON.stringify({ ...existing, count, alerts }))
                } catch (_) {}
              })
              .catch(() => {})

            // 4b. Historique caisse POS
            fetchLow(`/api/boutiques/${b.id}/pos-historique`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(hist => {
                if (Array.isArray(hist) && hist.length > 0) {
                  localStorage.setItem(`nopalou_pos_historique_${b.id}`, JSON.stringify(hist))
                }
              })
              .catch(() => {})

            // 4c. Clients & Crédits / Carnet de dettes (localStorage + IndexedDB)
            fetchLow(`/api/boutiques/${b.id}/credits-clients`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(cData => {
                if (cData?.clients && Array.isArray(cData.clients)) {
                  localStorage.setItem(`nopalou_offline_clients_${b.id}`, JSON.stringify(cData.clients))
                  import('@/lib/db-offline').then(({ sauvegarderClientsLocaux }) => {
                    sauvegarderClientsLocaux(cData.clients, b.id, currentUid).catch(() => {})
                  }).catch(() => {})

                  try {
                    const dettes = cData.clients
                      .filter((c: any) => c.solde > 0)
                      .reduce((s: number, c: any) => s + Number(c.solde || 0), 0)
                    const prevKey = `nopalou_offline_dash_counts_${b.id}`
                    const existingStr = localStorage.getItem(prevKey)
                    let existing: any = {}
                    if (existingStr) try { existing = JSON.parse(existingStr) } catch (_) {}
                    localStorage.setItem(prevKey, JSON.stringify({ ...existing, dettes }))
                  } catch (_) {}
                }
              })
              .catch(() => {})

            // 4d. Caissiers & PINs d'accès hors-ligne (localStorage + IndexedDB)
            fetchLow(`/api/boutiques/${b.id}/caissiers`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.caissiers) {
                  localStorage.setItem(`nopalou_offline_caissiers_${b.id}`, JSON.stringify(data.caissiers))
                  import('@/lib/db-offline').then(({ sauvegarderCaissiersLocaux }) => {
                    sauvegarderCaissiersLocaux(data.caissiers, b.id, currentUid).catch(() => {})
                  }).catch(() => {})
                }
              })
              .catch(() => {})

            // 4e. Admins
            fetchLow(`/api/boutiques/${b.id}/admins`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.admins) {
                  localStorage.setItem(`nopalou_offline_admins_${b.id}`, JSON.stringify(data.admins))
                }
              })
              .catch(() => {})

            // 4f. Commandes
            fetchLow(`/api/boutiques/${b.id}/commandes`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                const list = data?.commandes || (Array.isArray(data) ? data : [])
                localStorage.setItem(`nopalou_offline_commandes_${b.id}_`, JSON.stringify(list))
              })
              .catch(() => {})

            // 4g. Documents
            fetchLow(`/api/boutiques/${b.id}/documents`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.documents) {
                  localStorage.setItem(`nopalou_offline_docs_${b.id}`, JSON.stringify(data.documents))
                }
              })
              .catch(() => {})

            // 4h. Logs
            fetchLow(`/api/boutiques/${b.id}/logs?limit=150`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.logs) {
                  localStorage.setItem(`nopalou_offline_logs_${b.id}_tous`, JSON.stringify(data.logs))
                }
              })
              .catch(() => {})

            // 4i. Analytics
            fetchLow(`/api/analytics/boutique/${b.id}`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.stats) {
                  localStorage.setItem(`nopalou_offline_analytics_${b.id}`, JSON.stringify(data))
                }
              })
              .catch(() => {})

            // 4j. Comptabilité : Dashboard & métriques CA
            fetchLow(`/api/comptabilite/${b.id}/dashboard`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(cDash => {
                if (cDash) {
                  localStorage.setItem(`nopalou_offline_compta_dash_${b.id}`, JSON.stringify(cDash))
                  try {
                    const prevKey = `nopalou_offline_dash_counts_${b.id}`
                    const existingStr = localStorage.getItem(prevKey)
                    let existing: any = {}
                    if (existingStr) try { existing = JSON.parse(existingStr) } catch (_) {}
                    localStorage.setItem(
                      prevKey,
                      JSON.stringify({
                        ...existing,
                        ca: cDash.ca_mois ?? existing.ca ?? 0,
                        marge: cDash.marge_brute_mois ?? existing.marge ?? 0,
                        tauxMarge: cDash.taux_marge_mois ?? existing.tauxMarge ?? 0,
                      })
                    )
                  } catch (_) {}
                }
              })
              .catch(() => {})

            // 4k. Comptabilité : Ventes & Journal
            fetchLow(`/api/comptabilite/${b.id}/ventes`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(vData => {
                if (Array.isArray(vData)) {
                  localStorage.setItem(`nopalou_offline_compta_ventes_${b.id}`, JSON.stringify(vData))
                }
              })
              .catch(() => {})

            // 4l. Comptabilité : Dépenses
            fetchLow(`/api/comptabilite/${b.id}/depenses`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(dData => {
                if (Array.isArray(dData)) {
                  localStorage.setItem(`nopalou_offline_compta_depenses_${b.id}`, JSON.stringify(dData))
                }
              })
              .catch(() => {})

            // 4m. Comptabilité : Bilan
            fetchLow(`/api/comptabilite/${b.id}/bilan`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(bData => {
                if (bData && !bData.error) {
                  localStorage.setItem(`nopalou_bilan_${b.id}_fallback`, JSON.stringify(bData))
                }
              })
              .catch(() => {})

            // 4n. Comptabilité : Zones de livraison
            fetchLow(`/api/comptabilite/${b.id}/zones`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(zData => {
                if (Array.isArray(zData)) {
                  localStorage.setItem(`nopalou_offline_compta_zones_${b.id}`, JSON.stringify(zData))
                }
              })
              .catch(() => {})
          })
        })
        .catch(() => {})

      // 5. Précharge TOUTES les agences immobilières & tableaux de bord agences
      fetchLow('/api/agences/mine')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          const agencesList = d?.agences || (Array.isArray(d) ? d : [])
          if (agencesList.length === 0) return
          localStorage.setItem('nopalou_offline_agences_mine', JSON.stringify(agencesList))
          if (d.quotas) {
            localStorage.setItem('nopalou_offline_agences_quotas', JSON.stringify(d.quotas))
          }

          agencesList.forEach(async (a: any) => {
            if (!a.slug) return
            // Enregistre immédiatement l'agence de base
            localStorage.setItem(`nopalou_offline_agence_${a.slug}`, JSON.stringify(a))

            // 5a. Données générales détaillées de l'agence
            fetchLow(`/api/agences/${a.slug}`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.agence) localStorage.setItem(`nopalou_offline_agence_${a.slug}`, JSON.stringify(data.agence))
              })
              .catch(() => {})

            // 5b. Statistiques du tableau de bord agence
            fetchLow(`/api/agences/${a.slug}/stats`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.stats) localStorage.setItem(`nopalou_offline_agence_stats_${a.slug}`, JSON.stringify(data.stats))
              })
              .catch(() => {})

            // 5c. Notifications & alertes agence
            fetchLow(`/api/agences/agence/${a.slug}/notifications`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (data?.success) localStorage.setItem(`nopalou_offline_agence_notifs_${a.slug}`, JSON.stringify(data))
              })
              .catch(() => {})

            // 5d. Visites du jour
            fetchLow(`/api/crm-immo/agence/${a.slug}/visites?date=aujourdhui`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (Array.isArray(data?.visites)) localStorage.setItem(`nopalou_offline_agence_visites_${a.slug}`, JSON.stringify(data.visites))
              })
              .catch(() => {})

            // 5e. Portefeuille de biens de l'agence
            fetchLow(`/api/biens/agence/${a.slug}`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (Array.isArray(data?.biens)) localStorage.setItem(`nopalou_offline_agence_biens_${a.slug}`, JSON.stringify(data.biens))
              })
              .catch(() => {})

            // 5f. Baux locatifs de l'agence
            fetchLow(`/api/locatif-immo/agence/${a.slug}/baux`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (Array.isArray(data?.rows || data?.baux)) localStorage.setItem(`nopalou_offline_agence_baux_${a.slug}`, JSON.stringify(data.rows || data.baux))
              })
              .catch(() => {})

            // 5g. Contacts & prospects CRM
            fetchLow(`/api/crm-immo/agence/${a.slug}/contacts`)
              .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
              .then(data => {
                if (Array.isArray(data?.contacts)) localStorage.setItem(`nopalou_offline_agence_contacts_${a.slug}`, JSON.stringify(data.contacts))
              })
              .catch(() => {})
          })
        })
        .catch(() => {})

      // 6. Précharge Mes Locations & Baux locataire
      fetchLow('/api/locatif-immo/mes-locations')
        .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
        .then(d => {
          if (Array.isArray(d?.locations)) {
            localStorage.setItem('nopalou_offline_mes_locations', JSON.stringify(d.locations))
          }
        })
        .catch(() => {})

      // 7. Précharge le Suivi de Commandes (si téléphone utilisateur connu)
      const userTel = telephone || session?.telephone || session?.user?.telephone || ''
      if (userTel) {
        fetchLow(`/api/boutiques/commandes/suivi?q=${encodeURIComponent(userTel)}&ref=${encodeURIComponent(userTel)}&tel=${encodeURIComponent(userTel)}`)
          .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
          .then(d => {
            if (Array.isArray(d?.commandes)) {
              localStorage.setItem('nopalou_offline_suivi_commandes', JSON.stringify(d.commandes))
            }
          })
          .catch(() => {})
      }

      // 8. Précharge Sama Kalpé (Finances, dépenses, dettes, objectifs & journal)
      import('./kalpe/actions').then(async (kalpe) => {
        try {
          const [etatRes, synRes, objRes, detRes, opsRes] = await Promise.all([
            kalpe.getKalpeEtat().catch(() => null),
            kalpe.getKalpeSynthese('all').catch(() => null),
            kalpe.getKalpeObjectifs().catch(() => []),
            kalpe.getKalpeDettes({ contexte: 'all' }).catch(() => []),
            kalpe.getKalpeOperations({ contexte: 'all', limit: 30 }).catch(() => ({ operations: [], total: 0 })),
          ])
          if (etatRes || synRes) {
            localStorage.setItem('nopalou_offline_kalpe_snapshot', JSON.stringify({
              etat: etatRes,
              synthese: synRes,
              objectifs: objRes,
              dettes: detRes,
              operations: opsRes?.operations || [],
              operationsTotal: opsRes?.total || 0,
            }))
          }
        } catch (_) {}
      }).catch(() => {})

      // 9. Précharge Mes Alertes Prix
      if (currentUid) {
        import('@/app/actions/alertes').then(async ({ fetchUserAlertes }) => {
          try {
            const resAlertes = await fetchUserAlertes(currentUid)
            if (resAlertes?.ok && Array.isArray(resAlertes.alertes)) {
              localStorage.setItem(`nopalou_offline_alertes_${currentUid}`, JSON.stringify(resAlertes.alertes))
            }
          } catch (_) {}
        }).catch(() => {})
      }
    }, 1200)

    return () => clearTimeout(preloadTimer)
  }, [isOnline, session?.userId, telephone])

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
          {t('common.offlineMode')}
        </div>
      )}

      <div className="account-client-content" style={{ minWidth: 0 }}>
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

        {(tab === 'kalpe' || tab === 'sama-xaalis' || tab === 'finances') && (
          <SamaKalpeClient />
        )}

        {tab === 'mes-annonces' && (
          <>
            <AccountSubHeader
              title="Mes Annonces Classifiées"
              subtitle="Gérez la visibilité, les détails et la mise en vedette de vos articles"
              icon={Tag}
              actionLabel="+ Publier une annonce"
              actionHref="/deposer-annonce"
            />
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
          </>
        )}

        {tab === 'mes-annonces-immo' && (
          <>
            <AccountSubHeader
              title="Mes Annonces Immobilières"
              subtitle="Gérez vos biens à louer et à vendre sur Nopalou Immobilier"
              icon={Home}
              actionLabel="+ Publier bien immo"
              actionHref="/deposer-immo"
            />
            <AnnoncesImmoClient userId={session?.userId || (session as any)?.id} />
          </>
        )}

        {tab === 'suivi-commande' && (
          <>
            <AccountSubHeader
              title="Suivi de Mes Commandes"
              subtitle="Consultez l'avancement, le statut de préparation et la livraison de vos achats"
              icon={Package}
            />
            <SuiviCommandeClient userPhone={telephone || session?.telephone || session?.user?.telephone || ''} />
          </>
        )}

        {(tab === 'mes-locations' || tab === 'locations' || tab === 'baux') && (
          <>
            <AccountSubHeader
              title="Mes Locations & Quittances"
              subtitle="Consultez vos baux en cours, l'état de vos loyers et téléchargez vos quittances officielles certifiées"
              icon={Building2}
            />
            <MesLocationsClient />
          </>
        )}

        {(tab === 'mes-alertes' || tab === 'alertes') && (
          <>
            <AccountSubHeader
              title="Mes Alertes Prix"
              subtitle="Recevez des notifications instantanées par WhatsApp ou email quand un produit baisse"
              icon={Bell}
            />
            <AlertesClientTab userId={userId} />
          </>
        )}

        {tab === 'favoris' && (
          <>
            <AccountSubHeader
              title="Mes Favoris"
              subtitle="Vos produits, boutiques et biens immobiliers coup de cœur enregistrés"
              icon={Heart}
              iconColor="#DB2777"
            />
            <FavorisClient />
          </>
        )}

        {tab === 'profil' && (
          <>
            <AccountSubHeader
              title="Mon Profil & Sécurité"
              subtitle="Gérez vos coordonnées personnelles, vos accès et votre mot de passe"
              icon={User}
            />
            <ProfilClient nom={nom} email={email || ''} telephone={telephone || session?.telephone || ''} />
          </>
        )}

        {tab === 'apporteur' && (
          <>
            <AccountSubHeader
              title="Programme Apporteur d'Affaires"
              subtitle="Gagnez 20% de commissions récurrentes à vie sur chaque commerçant parrainé"
              icon={Users}
              iconColor="#D97706"
              countBadge="20% à vie"
            />
            <ApporteurClient />
          </>
        )}

        {(tab === 'fonctionnalites' || tab === 'abonnement' || tab === 'tarifs') && (
          <>
            <AccountSubHeader
              title="Formules & Avantages"
              subtitle="Découvrez toutes les fonctionnalités disponibles pour votre profil et vos boutiques"
              icon={Sparkles}
            />
            <FonctionnalitesClient />
          </>
        )}
      </div>
    </>
  )
}
