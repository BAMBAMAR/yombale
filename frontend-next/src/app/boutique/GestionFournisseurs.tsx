'use client'

import { useState } from 'react'
import { StockView } from './Comptabilite'
import { useTranslation } from '@/i18n/context'
import { useScrollNudge } from '@/hooks/useScrollNudge'
import { Package, Users, FileText } from 'lucide-react'
import type { Fournisseur, CommandeFournisseur } from './fournisseurs/types'
import { useGestionFournisseursData } from './fournisseurs/useGestionFournisseursData'
import FournisseursList from './fournisseurs/FournisseursList'
import CommandesFournisseursList from './fournisseurs/CommandesFournisseursList'
import ModalFournisseurForm from './fournisseurs/ModalFournisseurForm'
import ModalCommandeFournisseurForm from './fournisseurs/ModalCommandeFournisseurForm'
import ModalCommandeFournisseurDetails from './fournisseurs/ModalCommandeFournisseurDetails'
import ModalRecevoirCommande from './fournisseurs/ModalRecevoirCommande'

export default function GestionFournisseurs({ boutiqueId }: { boutiqueId: string }) {
  const { t } = useTranslation() as { t: any }
  const { scrollRef: fouTabRef, scrollToCenter: scrollFouToCenter } = useScrollNudge()
  const [subTab, setSubTab] = useState<'stock' | 'fournisseurs' | 'commandes'>('stock')

  const {
    fournisseurs,
    commandes,
    produits,
    loading,
    isSubmitting,
    uploadingFile,
    envoyerBonCommandeWhatsApp,
    handleSoumettreFormFournisseur,
    handleSupprimerFournisseur,
    handleCreerCommande,
    handleConfirmerReception,
    handleUploadFileCommande,
    handleSupprimerCommande,
  } = useGestionFournisseursData(boutiqueId, t)

  // Modals state
  const [modalFOUOuvert, setModalFOUOuvert] = useState(false)
  const [fournisseurAEditer, setFournisseurAEditer] = useState<Fournisseur | null>(null)

  const [modalCMDOuvert, setModalCMDOuvert] = useState(false)
  const [commandeAEditer, setCommandeAEditer] = useState<CommandeFournisseur | null>(null)

  const [cmdDetailsModal, setCmdDetailsModal] = useState<CommandeFournisseur | null>(null)
  const [modalRecevoirCmd, setModalRecevoirCmd] = useState<CommandeFournisseur | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub Tabs */}
      <div
        ref={fouTabRef}
        className="nopalou-scroll-tabs horizontal-scroll-fade"
        style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          gap: 12,
          paddingBottom: 4,
          overflowX: 'auto',
        }}
      >
        <button
          onClick={(e) => {
            setSubTab('stock')
            scrollFouToCenter(e.currentTarget)
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 12px',
            fontSize: 13.5,
            fontWeight: subTab === 'stock' ? 750 : 500,
            color: subTab === 'stock' ? 'var(--accent, #C75B00)' : '#475569',
            borderBottom: subTab === 'stock' ? '2px solid var(--accent, #C75B00)' : 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Package size={15} />
          <span>{t('shop.subTabStockInventory')}</span>
        </button>

        <button
          onClick={(e) => {
            setSubTab('fournisseurs')
            scrollFouToCenter(e.currentTarget)
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 12px',
            fontSize: 13.5,
            fontWeight: subTab === 'fournisseurs' ? 750 : 500,
            color: subTab === 'fournisseurs' ? 'var(--accent, #C75B00)' : '#475569',
            borderBottom: subTab === 'fournisseurs' ? '2px solid var(--accent, #C75B00)' : 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Users size={15} />
          <span>{t('shop.subTabSuppliersList')} ({fournisseurs.length})</span>
        </button>

        <button
          onClick={(e) => {
            setSubTab('commandes')
            scrollFouToCenter(e.currentTarget)
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 12px',
            fontSize: 13.5,
            fontWeight: subTab === 'commandes' ? 750 : 500,
            color: subTab === 'commandes' ? 'var(--accent, #C75B00)' : '#475569',
            borderBottom: subTab === 'commandes' ? '2px solid var(--accent, #C75B00)' : 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <FileText size={15} />
          <span>{t('shop.subTabPurchaseOrders')} ({commandes.length})</span>
        </button>
      </div>

      {subTab === 'stock' && <StockView boutiqueId={boutiqueId} />}

      {subTab === 'fournisseurs' && (
        <FournisseursList
          fournisseurs={fournisseurs}
          produits={produits}
          loading={loading}
          onNouveauFournisseur={() => {
            setFournisseurAEditer(null)
            setModalFOUOuvert(true)
          }}
          onEditerFournisseur={(f) => {
            setFournisseurAEditer(f)
            setModalFOUOuvert(true)
          }}
          onSupprimerFournisseur={handleSupprimerFournisseur}
          onEnvoyerBonCommandeWhatsApp={envoyerBonCommandeWhatsApp}
          t={t}
        />
      )}

      {subTab === 'commandes' && (
        <CommandesFournisseursList
          commandes={commandes}
          fournisseurs={fournisseurs}
          loading={loading}
          onNouvelleCommande={() => {
            setCommandeAEditer(null)
            setModalCMDOuvert(true)
          }}
          onEditerCommande={(cmd) => {
            setCommandeAEditer(cmd)
            setModalCMDOuvert(true)
          }}
          onVoirDetailsCommande={(cmd) => setCmdDetailsModal(cmd)}
          onOuvrirReception={(cmd) => setModalRecevoirCmd(cmd)}
          onSupprimerCommande={handleSupprimerCommande}
          t={t}
        />
      )}

      {/* Modal Fournisseur */}
      <ModalFournisseurForm
        ouvert={modalFOUOuvert}
        onFermer={() => {
          setModalFOUOuvert(false)
          setFournisseurAEditer(null)
        }}
        fournisseurAEditer={fournisseurAEditer}
        onSoumettre={handleSoumettreFormFournisseur}
        isSubmitting={isSubmitting}
        t={t}
      />

      {/* Modal Commande Form */}
      <ModalCommandeFournisseurForm
        ouvert={modalCMDOuvert}
        onFermer={() => {
          setModalCMDOuvert(false)
          setCommandeAEditer(null)
        }}
        commandeAEditer={commandeAEditer}
        fournisseurs={fournisseurs}
        produits={produits}
        onSoumettre={handleCreerCommande}
        onUploadFile={handleUploadFileCommande}
        isSubmitting={isSubmitting}
        uploadingFile={uploadingFile}
        t={t}
      />

      {/* Modal Détails Commande */}
      <ModalCommandeFournisseurDetails
        cmd={cmdDetailsModal}
        fournisseurs={fournisseurs}
        produits={produits}
        onFermer={() => setCmdDetailsModal(null)}
        onOuvrirReception={(cmd) => {
          setCmdDetailsModal(null)
          setModalRecevoirCmd(cmd)
        }}
        t={t}
      />

      {/* Modal Réception Commande */}
      <ModalRecevoirCommande
        cmd={modalRecevoirCmd}
        onFermer={() => setModalRecevoirCmd(null)}
        onConfirmerReception={handleConfirmerReception}
        onUploadFile={handleUploadFileCommande}
        isSubmitting={isSubmitting}
        uploadingFile={uploadingFile}
        t={t}
      />
    </div>
  )
}
