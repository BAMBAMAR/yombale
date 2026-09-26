'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { deleteBoutique } from './actions'
import { useTranslation } from '@/i18n/context'
import { useOnlineStatus } from '@/lib/useOnlineStatus'
import { useToast } from '@/context/ToastContext'

import type { Boutique, Variante, Produit, ManageTab, NavItem, NavGroup } from './types'
import BoutiqueCard from './components/BoutiqueCard'
import BoutiqueForm from './components/BoutiqueForm'
import BoutiqueManage from './components/BoutiqueManage'
import BoutiqueListHeader from './components/BoutiqueListHeader'
import ProductTourModal from './ProductTourModal'
import { useBoutiqueOfflinePreloader } from './hooks/useBoutiqueOfflinePreloader'

// Re-exports pour compatibilité avec d'autres modules
import ProduitForm from './ProduitForm'
import CatalogueProduits from './CatalogueProduits'
import BoutiqueProduitsTab from './components/BoutiqueProduitsTab'
import BoutiqueProduitModal from './components/BoutiqueProduitModal'
export { ProduitForm, CatalogueProduits, BoutiqueProduitsTab, BoutiqueProduitModal }
export type { Boutique, Variante, Produit, ManageTab, NavItem, NavGroup }

import { CaracChips } from '@/components/CaracChips'
import {
  type TypeVarianteId,
  CHAMP_VERS_TYPE_VARIANTE,
  champVisibleSelonVariante,
  nomParDefautPourCategorie,
  isNomParDefaut,
} from './boutiqueHelpers'
export { CaracChips, CHAMP_VERS_TYPE_VARIANTE, champVisibleSelonVariante, nomParDefautPourCategorie, isNomParDefaut }
export type { TypeVarianteId }

import { WifiOff, Store } from 'lucide-react'

export default function BoutiqueClient({
  boutiques,
  canCreate,
  planActif,
  codeApporteurDefaut,
  userId,
  settings,
}: {
  boutiques: Boutique[]
  canCreate: boolean
  planActif?: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  codeApporteurDefaut?: string
  userId: string
  settings: Record<string, string>
}) {
  const { t } = useTranslation()
  const { toast, confirmModal } = useToast()
  type Mode = 'list' | 'create' | { editing: Boutique } | { managing: Boutique }
  const [mode, setMode] = useState<Mode>('list')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [sponsorError] = useState<string | null>(null)
  const router = useRouter()

  const [boutiquesList, setBoutiquesList] = useState<Boutique[]>(() => {
    if (boutiques && boutiques.length > 0) return boutiques
    if (typeof window !== 'undefined') {
      const cachedStr = localStorage.getItem('nopalou_pos_user_boutiques')
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr)
          if (Array.isArray(cached) && cached.length > 0) return cached
        } catch (_) {}
      }
    }
    return []
  })

  const isReallyOnline = useOnlineStatus()
  const [dashboardOffline, setDashboardOffline] = useState(false)
  useEffect(() => {
    setDashboardOffline(!isReallyOnline)
  }, [isReallyOnline])

  const [showProductTour, setShowProductTour] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const tourDone = localStorage.getItem('nopalou_merchant_tour_done')
        if (!tourDone && (boutiques.length > 0 || boutiquesList.length > 0)) {
          const timer = setTimeout(() => setShowProductTour(true), 1200)
          return () => clearTimeout(timer)
        }
      } catch (e) {
        console.warn('[Nopalou:BoutiqueClient:tour]', e)
      }
    }
  }, [boutiques.length, boutiquesList.length])

  // Plan actif : persistance offline sans purge destructrice
  const [planActifEffectif, setPlanActifEffectif] = useState<'pro' | 'business' | 'decouverte' | 'taf_taf' | null>(() => {
    if (planActif) return planActif as any
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('nopalou_plan_actif')
      if (cached) return cached as any
      const cachedBoutiquesStr = localStorage.getItem('nopalou_pos_user_boutiques')
      if (cachedBoutiquesStr) {
        try {
          const parsed = JSON.parse(cachedBoutiquesStr)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const bPlan = parsed[0]?.plan_actif || parsed[0]?.plan_souscrit
            if (bPlan) return bPlan
          }
        } catch (_) {}
      }
    }
    return null
  })

  useEffect(() => {
    if (planActif) {
      setPlanActifEffectif(planActif as any)
      if (typeof window !== 'undefined') {
        localStorage.setItem('nopalou_plan_actif', planActif)
      }
    } else {
      // En mode hors-ligne ou si le serveur renvoie null temporairement,
      // NE PAS PURGER nopalou_plan_actif ! Conserver le plan souscrit en local ou celui de la boutique.
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('nopalou_plan_actif')
        if (cached) {
          setPlanActifEffectif(cached as any)
        } else if (boutiquesList.length > 0) {
          const bPlan = boutiquesList[0]?.plan_actif || boutiquesList[0]?.plan_souscrit
          if (bPlan) setPlanActifEffectif(bPlan as any)
        }
      }
    }
  }, [planActif, boutiquesList])

  useEffect(() => {
    if (boutiques && boutiques.length > 0) {
      setBoutiquesList(boutiques)
      if (typeof window !== 'undefined') {
        localStorage.setItem('nopalou_pos_user_boutiques', JSON.stringify(boutiques))
      }
    } else {
      const cachedStr = typeof window !== 'undefined' ? localStorage.getItem('nopalou_pos_user_boutiques') : null
      if (cachedStr) {
        try {
          const cached = JSON.parse(cachedStr)
          if (cached && Array.isArray(cached) && cached.length > 0) {
            setBoutiquesList(cached)
          }
        } catch (e) {
          console.warn('[Nopalou:BoutiqueClient:cache]', e)
        }
      }
    }
  }, [boutiques])

  const searchParams = useSearchParams()
  const manageId = searchParams.get('manage') || searchParams.get('id') || searchParams.get('b') || searchParams.get('boutique')
  const tabParam = searchParams.get('tab')
  const lockedParam = searchParams.get('locked')

  useEffect(() => {
    const listToSearch = boutiquesList.length > 0 ? boutiquesList : boutiques

    setMode((prevMode) => {
      if (manageId && listToSearch.length > 0) {
        const targetBoutique = listToSearch.find(
          (b) => b.id === manageId || b.slug === manageId || b.nom?.toLowerCase() === manageId.toLowerCase()
        )
        if (targetBoutique) return { managing: targetBoutique }
      }

      if (typeof prevMode === 'object' && 'managing' in prevMode) {
        const updatedTarget = listToSearch.find((b) => b.id === prevMode.managing.id)
        if (updatedTarget && updatedTarget !== prevMode.managing) {
          return { managing: updatedTarget }
        }
        return prevMode
      }

      if (tabParam && tabParam !== 'caisse' && listToSearch.length > 0) {
        return { managing: listToSearch[0] }
      }

      if (listToSearch.length === 1 && prevMode === 'list' && !searchParams.get('list')) {
        return { managing: listToSearch[0] }
      }

      return prevMode
    })
  }, [manageId, tabParam, lockedParam, boutiquesList, boutiques, searchParams])

  // Hook autonome pour le préchargement offline
  useBoutiqueOfflinePreloader(boutiquesList, boutiques, isReallyOnline, userId)

  const prixPro = Number(settings.plan_pro_prix) || 5000

  async function handleDelete(id: string) {
    const ok = await confirmModal({
      title: 'Supprimer la boutique',
      message: 'Souhaitez-vous vraiment supprimer cette boutique définitivement ? Cette action est irréversible.',
      confirmLabel: 'Supprimer définitivement',
      isDanger: true,
    })
    if (!ok) return
    setDeleteError(null)
    const result = await deleteBoutique(id)
    if (result.error) {
      setDeleteError(result.error)
      toast.error(result.error)
    } else {
      setSuccessMsg('Boutique supprimée.')
      toast.success('Boutique supprimée avec succès.')
      router.refresh()
    }
  }

  function handleSuccess() {
    const isEdit = typeof mode === 'object' && 'editing' in mode
    setSuccessMsg(isEdit ? 'Boutique modifiée avec succès !' : 'Boutique créée avec succès !')
    setMode('list')
    router.refresh()
  }

  // Mode formulaire création / modification
  if (mode === 'create' || (typeof mode === 'object' && 'editing' in mode)) {
    return (
      <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 24px' }}>
        <BoutiqueForm
          boutique={typeof mode === 'object' && 'editing' in mode ? mode.editing : undefined}
          onCancel={() => setMode('list')}
          onSuccess={handleSuccess}
          codeApporteurDefaut={codeApporteurDefaut}
        />
      </div>
    )
  }

  // Mode gestion — layout pleine largeur avec sidebar
  if (typeof mode === 'object' && 'managing' in mode) {
    return (
      <BoutiqueManage
        boutique={mode.managing}
        boutiques={boutiquesList}
        planActif={planActifEffectif || mode.managing.plan_actif || (mode.managing.plan_souscrit as any) || null}
        initialTab={tabParam ?? undefined}
        hasMultipleBoutiques={boutiquesList.length > 1}
        onSelectBoutique={(b) => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set('manage', b.id)
            window.history.replaceState(null, '', url.toString())
          }
          setMode({ managing: b })
        }}
        onCreateBoutique={() => setMode('create')}
        onBack={() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.delete('manage')
            url.searchParams.delete('id')
            url.searchParams.delete('tab')
            url.searchParams.delete('locked')
            window.history.replaceState(null, '', url.pathname)
          }
          setMode('list')
        }}
        onEdit={() => {
          setSuccessMsg('Boutique modifiée avec succès !')
          setMode('list')
          router.refresh()
        }}
        prixPro={prixPro}
      />
    )
  }

  // Vue liste des boutiques
  return (
    <main className="bq-list-outer-wrap" style={{ maxWidth: 1200, margin: '32px auto', padding: '0 20px 80px', overflowX: 'hidden' }}>
      <BoutiqueListHeader
        boutiquesCount={boutiques.length}
        canCreate={canCreate}
        planActif={planActif}
        prixPro={prixPro}
        successMsg={successMsg}
        deleteError={deleteError}
        sponsorError={sponsorError}
        onOpenProductTour={() => setShowProductTour(true)}
        onCreateShop={() => setMode('create')}
      />

      {boutiquesList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 20px', background: '#fff', borderRadius: 16, border: '1px dashed #d1d5db' }}>
          <Store size={48} style={{ color: 'var(--accent)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 8 }}>{t('shop.createShopPrompt')}</p>
          <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>{t('shop.createShopDesc')}</p>
          <button
            onClick={() => setMode('create')}
            style={{
              padding: '12px 28px',
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(199,91,0,0.25)',
            }}
          >
            {t('shop.createMyFirstShop')}
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(360px, 100%), 1fr))',
            gap: 24,
            alignItems: 'start',
          }}
        >
          {boutiquesList.map((b) => (
            <BoutiqueCard
              key={b.id}
              boutique={b}
              planActif={planActifEffectif ?? null}
              onEdit={() => setMode({ editing: b })}
              onDelete={() => handleDelete(b.id)}
              onManage={() => setMode({ managing: b })}
            />
          ))}
        </div>
      )}

      {/* Notification Hors-Ligne Dashboard */}
      {dashboardOffline && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#c2410c',
            color: 'white',
            padding: '10px 24px',
            borderRadius: 30,
            fontWeight: 700,
            fontSize: 14,
            zIndex: 999999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <WifiOff size={16} />
          <span>Mode Hors-Ligne (Données en cache)</span>
        </div>
      )}

      {/* Product Tour Onboarding Marchand */}
      <ProductTourModal
        isOpen={showProductTour}
        onClose={() => setShowProductTour(false)}
        onAjouterProduitDirect={() => {
          setShowProductTour(false)
          if (boutiquesList.length > 0) {
            setMode({ managing: boutiquesList[0] })
            router.push(`/boutique?manage=${boutiquesList[0].id}&tab=produits`)
          }
        }}
      />
    </main>
  )
}
