'use client'

import React from 'react'
import {
  Package,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react'
import { useTranslation } from '@/i18n/context'
import { telechargerModeleCSV } from './batch-import/csvHelpers'
import { useBatchImportData } from './batch-import/useBatchImportData'
import BatchImportFileView from './batch-import/BatchImportFileView'
import BatchImportCatalogView from './batch-import/BatchImportCatalogView'

export default function BatchImportModal({
  boutiqueId,
  onClose,
  onSuccess,
}: {
  boutiqueId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const { t } = useTranslation()

  const {
    modeImport,
    setModeImport,
    categorieActive,
    setCategorieActive,
    saisies,
    lignesFichier,
    diagnostic,
    nomFichier,
    loading,
    submitting,
    rechercheCatalogue,
    setRechercheCatalogue,
    error,
    successMsg,
    templatesAffiches,
    nbArticlesSelectionnes,
    handleFileUpload,
    toggleSelection,
    updatePrix,
    updateQuantite,
    clearFileSelection,
    validerBatch,
  } = useBatchImportData({ boutiqueId, onSuccess })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
      >
        {/* En-tête de la modale */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: '#FFF7ED',
                color: 'var(--accent, #C75B00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 850, color: '#0F172A' }}>
                Ajout Rapide &amp; Import de Produits
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
                Constituez votre catalogue en quelques secondes sans ressaisie fastidieuse.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Sélecteur de mode (Onglets Produits Standards vs Import Fichier) */}
        <div style={{ padding: '12px 24px 0', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              background: '#F1F5F9',
              padding: 4,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <button
              onClick={() => setModeImport('catalogue')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 9,
                border: 'none',
                background: modeImport === 'catalogue' ? '#fff' : 'transparent',
                color: modeImport === 'catalogue' ? 'var(--accent, #C75B00)' : '#64748B',
                fontWeight: modeImport === 'catalogue' ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: modeImport === 'catalogue' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Sparkles size={16} />
              <span>1. Modèles prêts à l&apos;emploi</span>
            </button>
            <button
              onClick={() => setModeImport('fichier')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 9,
                border: 'none',
                background: modeImport === 'fichier' ? '#fff' : 'transparent',
                color: modeImport === 'fichier' ? '#1D4ED8' : '#64748B',
                fontWeight: modeImport === 'fichier' ? 800 : 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: modeImport === 'fichier' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <FileSpreadsheet size={16} />
              <span>2. Importer un fichier (Excel / CSV / Shopify)</span>
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1.5px solid #bbf7d0',
                color: '#15803d',
                padding: '14px 18px',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 800,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {modeImport === 'fichier' ? (
            <BatchImportFileView
              nomFichier={nomFichier}
              diagnostic={diagnostic}
              lignesFichier={lignesFichier}
              onFileUpload={handleFileUpload}
              onClearFile={clearFileSelection}
              onDownloadTemplate={telechargerModeleCSV}
            />
          ) : (
            <BatchImportCatalogView
              loading={loading}
              categorieActive={categorieActive}
              setCategorieActive={setCategorieActive}
              rechercheCatalogue={rechercheCatalogue}
              setRechercheCatalogue={setRechercheCatalogue}
              templatesAffiches={templatesAffiches}
              saisies={saisies}
              toggleSelection={toggleSelection}
              updatePrix={updatePrix}
              updateQuantite={updateQuantite}
            />
          )}
        </div>

        {/* Pied de page avec bouton de validation final */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
          }}
        >
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              {nbArticlesSelectionnes} article(s) prêt(s) à être ajouté(s)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                background: '#fff',
                color: '#475569',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={submitting || nbArticlesSelectionnes === 0}
              onClick={validerBatch}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                background:
                  modeImport === 'fichier'
                    ? 'linear-gradient(135deg, #1D4ED8, #1E40AF)'
                    : 'linear-gradient(135deg, var(--accent, #C75B00), #EA580C)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 13.5,
                cursor: submitting || nbArticlesSelectionnes === 0 ? 'not-allowed' : 'pointer',
                opacity: submitting || nbArticlesSelectionnes === 0 ? 0.6 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              }}
            >
              <span>{submitting ? 'Importation en cours…' : 'Ajouter à ma boutique'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
