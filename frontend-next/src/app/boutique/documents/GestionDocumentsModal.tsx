'use client'

import React from 'react'
import { fcfa } from '@/lib/format'
import SearchableClientSelect from '@/components/SearchableClientSelect'
import GestionDocumentsProductPicker from './GestionDocumentsProductPicker'
import GestionDocumentsCartLines from './GestionDocumentsCartLines'
import type { LigneDocument } from './types'

interface GestionDocumentsModalProps {
  documentEnEdition: any | null
  typeDoc: 'facture' | 'devis' | 'proforma'
  setTypeDoc: (val: 'facture' | 'devis' | 'proforma') => void
  statutDoc: 'brouillon' | 'valide' | 'paye'
  setStatutDoc: (val: 'brouillon' | 'valide' | 'paye') => void
  clientIdSelected: string
  setClientIdSelected: (val: string) => void
  clients: any[]
  produits: any[]
  modeAjout: 'catalogue' | 'libre' | 'scan'
  setModeAjout: (val: 'catalogue' | 'libre' | 'scan') => void
  rechercheProduitModal: string
  setRechercheProduitModal: (val: string) => void
  categorieProduitModal: string
  setCategorieProduitModal: (val: string) => void
  categoriesCatalogue: string[]
  produitsFiltresModal: any[]
  libelleLibreInput: string
  setLibelleLibreInput: (val: string) => void
  prixLibreInput: string
  setPrixLibreInput: (val: string) => void
  qteLibreInput: number
  setQteLibreInput: (val: number) => void
  ocrDetections: string[]
  lignesSelectionnees: LigneDocument[]
  noteDoc: string
  setNoteDoc: (val: string) => void
  isSubmitting: boolean
  totalArticles: number
  totalTTC: number
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onAjouterProduitCatalogue: (prod: any, delta?: number) => void
  onDiminuerProduitCatalogue: (prodId: string) => void
  onAjouterLigneLibre: () => void
  onModifierLigne: (index: number, champ: keyof LigneDocument, valeur: any) => void
  onSupprimerLigne: (index: number) => void
  onViderPanier: () => void
  onDemarrerScannerEan: () => void
  onDemarrerScannerNom: () => void
  t: (key: string) => string
}

export default function GestionDocumentsModal({
  documentEnEdition,
  typeDoc,
  setTypeDoc,
  statutDoc,
  setStatutDoc,
  clientIdSelected,
  setClientIdSelected,
  clients,
  produits,
  modeAjout,
  setModeAjout,
  rechercheProduitModal,
  setRechercheProduitModal,
  categorieProduitModal,
  setCategorieProduitModal,
  categoriesCatalogue,
  produitsFiltresModal,
  libelleLibreInput,
  setLibelleLibreInput,
  prixLibreInput,
  setPrixLibreInput,
  qteLibreInput,
  setQteLibreInput,
  ocrDetections,
  lignesSelectionnees,
  noteDoc,
  setNoteDoc,
  isSubmitting,
  totalArticles,
  totalTTC,
  onClose,
  onSubmit,
  onAjouterProduitCatalogue,
  onDiminuerProduitCatalogue,
  onAjouterLigneLibre,
  onModifierLigne,
  onSupprimerLigne,
  onViderPanier,
  onDemarrerScannerEan,
  onDemarrerScannerNom,
  t,
}: GestionDocumentsModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 16,
          padding: '24px 20px',
          width: '100%',
          maxWidth: 780,
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            borderBottom: '1px solid #e2e8f0',
            paddingBottom: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0f172a' }}>
              {documentEnEdition
                ? `${t('shop.editDocumentModalTitle')} ${documentEnEdition.reference}`
                : t('shop.newDocumentModalTitle')}
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>{t('shop.docModalSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              fontSize: 16,
              fontWeight: 800,
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Type, Statut et Client */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
              background: '#f8fafc',
              padding: 12,
              borderRadius: 12,
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                {t('shop.documentType')} *
              </label>
              <select
                value={typeDoc}
                onChange={(e) => setTypeDoc(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontWeight: 700,
                  background: '#fff',
                }}
              >
                <option value="facture">{t('shop.invoiceSaleOption')}</option>
                <option value="devis">{t('shop.quoteOption')}</option>
                <option value="proforma">{t('shop.proformaOption')}</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                {t('shop.initialStatusLabel')}
              </label>
              <select
                value={statutDoc}
                onChange={(e) => setStatutDoc(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  fontWeight: 700,
                  background: '#fff',
                }}
              >
                <option value="brouillon">{t('shop.statusDraftOption')}</option>
                <option value="valide">{t('shop.statusValidatedOption')}</option>
                {typeDoc === 'facture' && <option value="paye">{t('shop.statusPaidOption')}</option>}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#334155', marginBottom: 4 }}>
                {t('shop.associatedClientLabel')}
              </label>
              <SearchableClientSelect
                clients={clients}
                value={clientIdSelected}
                onChange={(cId) => setClientIdSelected(cId)}
                placeholder={t('shop.anonymousWalkInClient')}
              />
            </div>
          </div>

          {/* ── Onglets de Sélection d'Articles ────────────────────────── */}
          <GestionDocumentsProductPicker
            modeAjout={modeAjout}
            setModeAjout={setModeAjout}
            produits={produits}
            rechercheProduitModal={rechercheProduitModal}
            setRechercheProduitModal={setRechercheProduitModal}
            categorieProduitModal={categorieProduitModal}
            setCategorieProduitModal={setCategorieProduitModal}
            categoriesCatalogue={categoriesCatalogue}
            produitsFiltresModal={produitsFiltresModal}
            lignesSelectionnees={lignesSelectionnees}
            libelleLibreInput={libelleLibreInput}
            setLibelleLibreInput={setLibelleLibreInput}
            prixLibreInput={prixLibreInput}
            setPrixLibreInput={setPrixLibreInput}
            qteLibreInput={qteLibreInput}
            setQteLibreInput={setQteLibreInput}
            ocrDetections={ocrDetections}
            onAjouterProduitCatalogue={onAjouterProduitCatalogue}
            onDiminuerProduitCatalogue={onDiminuerProduitCatalogue}
            onAjouterLigneLibre={onAjouterLigneLibre}
            onDemarrerScannerEan={onDemarrerScannerEan}
            onDemarrerScannerNom={onDemarrerScannerNom}
            t={t}
          />

          {/* ── Panier Mixte / Articles Ajoutés au Document ────────────── */}
          <GestionDocumentsCartLines
            lignesSelectionnees={lignesSelectionnees}
            produits={produits}
            totalArticles={totalArticles}
            totalTTC={totalTTC}
            onViderPanier={onViderPanier}
            onModifierLigne={onModifierLigne}
            onSupprimerLigne={onSupprimerLigne}
            t={t}
          />

          {/* Notes et Conditions */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
              {t('shop.notesTermsDocLabel')}
            </label>
            <textarea
              value={noteDoc}
              onChange={(e) => setNoteDoc(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 12.5,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              rows={2}
              placeholder={t('shop.notesTermsDocPlaceholder')}
            />
          </div>

          {/* Actions Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid #e2e8f0',
              paddingTop: 14,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
              {t('shop.totalTtcColon')} <span style={{ color: '#0284c7' }}>{fcfa(totalTTC)}</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || lignesSelectionnees.length === 0}
                style={{
                  padding: '9px 20px',
                  borderRadius: 8,
                  background: lignesSelectionnees.length === 0 ? '#94a3b8' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  cursor: lignesSelectionnees.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: 13,
                }}
              >
                {isSubmitting
                  ? t('shop.savingDocInProgress')
                  : documentEnEdition
                  ? t('shop.saveDocChangesBtn')
                  : `${t('shop.createDocumentBtnTotal')} (${fcfa(totalTTC)})`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
