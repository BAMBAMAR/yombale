'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Boutique, ManageTab } from '../../types'
import BoutiqueDashboard from '../BoutiqueDashboard'
import DashboardFacile from '../DashboardFacile'
import BoutiqueForm from '../BoutiqueForm'
import CatalogueProduits from '../../CatalogueProduits'
import Commandes from '../../Commandes'
import CarnetDettes from '../../CarnetDettes'
import Comptabilite, { SaisieExpressView } from '../../Comptabilite'
import AnalyticsClient from '../../analytics/AnalyticsClient'

// Code-splitting dynamique pour alléger le bundle JS initial du Studio Marchand
const StudioPersonnalisation = dynamic(() => import('../../StudioPersonnalisation'))
const MarketingBoutique = dynamic(() => import('../../MarketingBoutique'))
const SocialShopManager = dynamic(() => import('../../SocialShopManager'))
const BoutiqueEquipe = dynamic(() => import('../../BoutiqueEquipe'))
const BoutiqueAdmins = dynamic(() => import('../../BoutiqueAdmins'))
const BoutiqueCaissiers = dynamic(() => import('../../BoutiqueCaissiers'))
const GestionDocuments = dynamic(() => import('../../GestionDocuments'))
const GestionFournisseurs = dynamic(() => import('../../GestionFournisseurs'))
const ParametresFiscalite = dynamic(() => import('../../ParametresFiscalite'))
const ParametresFidelitePromos = dynamic(() => import('../../ParametresFidelitePromos'))
const BoutiqueLogs = dynamic(() => import('../../BoutiqueLogs'))
const PortailDeveloppeurBoutique = dynamic(() => import('../../PortailDeveloppeurBoutique'))
const AppStoreBoutique = dynamic(() => import('../../AppStoreBoutique'))
const GestionEntrepots = dynamic(() => import('../../GestionEntrepots'))
const ABTestingManager = dynamic(() => import('../ABTestingManager'))
import { Sparkles } from 'lucide-react'


interface BoutiqueManageContentProps {
  tab: ManageTab
  boutique: Boutique
  effectivePlan: 'pro' | 'business' | 'decouverte' | 'taf_taf' | null
  prixPro: number
  subTabCompta: 'bilan' | 'dashboard' | 'express' | 'ventes' | 'depenses'
  isModeFacile: boolean
  onSetModeFacile: (enabled: boolean) => void
  filtreProduitsMarketing: 'jamais_partage' | undefined
  onSetFiltreProduitsMarketing: (filter: 'jamais_partage' | undefined) => void
  onNavigateTab: (targetTab: ManageTab, subTab?: string) => void
  onBack: () => void
  onBoutiqueSaved: () => void
  onOpenQrModal: () => void
  nbEnAttente: number
}

export default function BoutiqueManageContent({
  tab,
  boutique,
  effectivePlan,
  prixPro,
  subTabCompta,
  isModeFacile,
  onSetModeFacile,
  filtreProduitsMarketing,
  onSetFiltreProduitsMarketing,
  onNavigateTab,
  onBack,
  onBoutiqueSaved,
  onOpenQrModal,
  nbEnAttente,
}: BoutiqueManageContentProps) {
  const router = useRouter()

  return (
    <>
      {tab === 'dashboard' &&
        (isModeFacile ? (
          <DashboardFacile
            boutiqueNom={boutique.nom}
            boutiqueId={boutique.id}
            onOuvrirAjoutProduit={() => {
              onSetFiltreProduitsMarketing(undefined)
              onNavigateTab('produits')
            }}
            onNaviguerOnglet={(t) => onNavigateTab(t as ManageTab)}
            onBasculerModeComplet={() => onSetModeFacile(false)}
          />
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => onSetModeFacile(true)}
                style={{
                  background: 'var(--orange2, #FFF3E8)',
                  border: '1px solid #FED7AA',
                  color: 'var(--accent, #C75B00)',
                  borderRadius: 10,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 1px 3px rgba(199,91,0,0.1)',
                }}
              >
                <Sparkles size={14} />
                <span>Activer le Mode Facile (Caisse Taf-Taf)</span>
              </button>
            </div>
            <BoutiqueDashboard
              boutique={boutique}
              planActif={effectivePlan}
              nbEnAttente={nbEnAttente}
              onNavigate={onNavigateTab}
            />
          </>
        ))}

      {tab === 'produits' && (
        <CatalogueProduits
          boutique={boutique}
          planActif={effectivePlan}
          prixPro={prixPro}
          filtreInitial={filtreProduitsMarketing}
        />
      )}

      {tab === 'commandes' && <Commandes boutiqueId={boutique.id} boutique={boutique} />}
      {tab === 'carnet' && <CarnetDettes boutique={boutique} planActif={effectivePlan} />}
      {tab === 'express' && <SaisieExpressView boutiqueId={boutique.id} />}
      {tab === 'compta' && (
        <Comptabilite
          boutiqueId={boutique.id}
          boutiqueNom={boutique.nom}
          initialTab={subTabCompta as any}
        />
      )}
      {tab === 'analytics' && <AnalyticsClient boutiques={[{ id: boutique.id, nom: boutique.nom }]} />}
      {(tab === 'personnaliser' || tab === 'studio') && (
        <StudioPersonnalisation boutique={boutique as any} onSaved={onBoutiqueSaved} />
      )}
      {tab === 'infos' && (
        <div style={{ maxWidth: 580 }}>
          <BoutiqueForm boutique={boutique} onCancel={onBack} onSuccess={onBoutiqueSaved} />
        </div>
      )}
      {tab === 'marketing' && (
        <MarketingBoutique
          boutique={boutique}
          onVoirJamaisPartages={() => {
            onSetFiltreProduitsMarketing('jamais_partage')
            onNavigateTab('produits')
          }}
          onOpenQrModal={onOpenQrModal}
          onNavigate={(t) => onNavigateTab(t)}
          planActif={effectivePlan}
        />
      )}
      {tab === 'social' && (
        <SocialShopManager
          boutiqueId={boutique.id}
          boutiqueNom={boutique.nom}
          boutiqueSlug={boutique.slug}
        />
      )}
      {tab === 'equipe' && <BoutiqueEquipe boutiqueId={boutique.id} />}
      {tab === 'admins' && <BoutiqueAdmins boutiqueId={boutique.id} />}
      {tab === 'caissiers' && <BoutiqueCaissiers boutiqueId={boutique.id} />}
      {tab === 'documents' && <GestionDocuments boutiqueId={boutique.id} />}
      {tab === 'fournisseurs' && <GestionFournisseurs boutiqueId={boutique.id} />}
      {tab === 'fiscalite' && <ParametresFiscalite boutique={boutique} onUpdate={() => router.refresh()} />}
      {tab === 'fidelite' && <ParametresFidelitePromos boutique={boutique} onUpdate={() => router.refresh()} />}
      {tab === 'journal' && <BoutiqueLogs boutiqueId={boutique.id} />}
      {tab === 'developer' && (
        <PortailDeveloppeurBoutique boutiqueId={boutique.id} planActif={effectivePlan || 'decouverte'} />
      )}
      {tab === 'appstore' && (
        <AppStoreBoutique
          boutiqueId={boutique.id}
          initialMetaPixel={boutique.meta_pixel_id || ''}
          initialTiktokPixel={boutique.tiktok_pixel_id || ''}
          initialGa4={boutique.ga4_id || ''}
        />
      )}
      {tab === 'entrepots' && <GestionEntrepots boutiqueId={boutique.id} />}
      {tab === 'abtesting' && <ABTestingManager boutiqueId={boutique.id} />}
    </>
  )
}
