'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, ScanBarcode, Camera, Trash2, Check, FileText } from 'lucide-react'
import SearchableProductSelect from '@/components/SearchableProductSelect'
import { fcfa } from '@/lib/format'
import type { CommandeFournisseur, Fournisseur, LigneCommandeForm } from './types'
import { useFournisseursScanners } from './useFournisseursScanners'
import ScannerFournisseursModals from './ScannerFournisseursModals'

interface ModalCommandeFournisseurFormProps {
  ouvert: boolean
  onFermer: () => void
  commandeAEditer: CommandeFournisseur | null
  fournisseurs: Fournisseur[]
  produits: any[]
  onSoumettre: (
    cmdEditId: string | null,
    cmdFournisseurId: string,
    cmdLignes: LigneCommandeForm[],
    cmdJustificatifUrl: string
  ) => Promise<boolean>
  onUploadFile: (file: File) => Promise<string | null>
  isSubmitting: boolean
  uploadingFile: boolean
  t: (key: string) => string
}

export default function ModalCommandeFournisseurForm({
  ouvert,
  onFermer,
  commandeAEditer,
  fournisseurs,
  produits,
  onSoumettre,
  onUploadFile,
  isSubmitting,
  uploadingFile,
  t,
}: ModalCommandeFournisseurFormProps) {
  const [cmdFournisseurId, setCmdFournisseurId] = useState('')
  const [cmdJustificatifUrl, setCmdJustificatifUrl] = useState('')
  const [cmdLignes, setCmdLignes] = useState<LigneCommandeForm[]>([])

  const scanners = useFournisseursScanners({
    produits,
    cmdLignes,
    setCmdLignes,
  })

  useEffect(() => {
    if (commandeAEditer) {
      setCmdFournisseurId(commandeAEditer.fournisseur_id || '')
      setCmdJustificatifUrl(commandeAEditer.justificatif_url || '')
      const items =
        typeof commandeAEditer.items === 'string'
          ? JSON.parse(commandeAEditer.items || '[]')
          : commandeAEditer.items || []
      setCmdLignes(
        items.map((i: any) => ({
          produitId: i.id || i.produitId || '',
          nomLibre: i.nomLibre || (i.id === 'custom' ? i.nom : undefined),
          quantite: Number(i.quantite || 1),
          prixAchat: Number(i.prix_achat || i.prixAchat || i.prix || 0),
        }))
      )
    } else {
      setCmdFournisseurId('')
      setCmdJustificatifUrl('')
      setCmdLignes([])
    }
  }, [commandeAEditer, ouvert])

  if (!ouvert) return null

  const handleAjouterLigne = () => {
    setCmdLignes((prev) => [...prev, { produitId: '', quantite: 1, prixAchat: 0 }])
  }

  const handleModifierLigne = (index: number, champ: keyof LigneCommandeForm, valeur: any) => {
    setCmdLignes((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [champ]: valeur } : l))
    )
  }

  const handleSupprimerLigne = (index: number) => {
    setCmdLignes((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await onUploadFile(file)
    if (url) {
      setCmdJustificatifUrl(url)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ok = await onSoumettre(
      commandeAEditer ? commandeAEditer.id : null,
      cmdFournisseurId,
      cmdLignes,
      cmdJustificatifUrl
    )
    if (ok) {
      onFermer()
    }
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
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
            borderRadius: 14,
            padding: 24,
            width: '100%',
            maxWidth: 700,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              {commandeAEditer
                ? t('shop.editPurchaseOrderModalTitle')
                : t('shop.newPurchaseOrderModalTitle')}
            </h3>
            <button
              type="button"
              onClick={onFermer}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                {t('shop.selectSupplierPrompt')} *
              </label>
              <select
                value={cmdFournisseurId}
                onChange={(e) => setCmdFournisseurId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 8,
                  border: '1px solid #d1d5db',
                  fontSize: 13,
                  outline: 'none',
                  background: '#fff',
                }}
                required
              >
                <option value="">{t('shop.chooseSupplierDefault')}</option>
                {fournisseurs.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: '#334155' }}>
                {t('shop.justificatifDocLabel')}
              </label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  style={{ fontSize: 13 }}
                  disabled={uploadingFile}
                />
                {uploadingFile && (
                  <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                    {t('shop.uploadingFileProgress')}
                  </span>
                )}
              </div>
              {cmdJustificatifUrl && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <FileText size={14} />
                  <span>{t('shop.justificatifAttachedBadge')}</span>
                  <a
                    href={cmdJustificatifUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none' }}
                  >
                    {t('shop.consultLink')}
                  </a>
                  <button
                    type="button"
                    onClick={() => setCmdJustificatifUrl('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontWeight: 700,
                      marginLeft: 'auto',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
                {t('shop.autoAttachAccountingHelp')}
              </p>
            </div>

            {/* Lignes d'achats */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1f2937' }}>
                    {t('shop.articlesToOrderHeader')}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>
                    {t('shop.articlesToOrderHelp')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={scanners.demarrerScannerEanCmd}
                    style={{
                      padding: '6px 12px',
                      background: '#e0f2fe',
                      color: '#0369a1',
                      border: '1px solid #bae6fd',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <ScanBarcode size={14} />
                    <span>{t('shop.scanEanBtn')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAjouterLigne}
                    style={{
                      padding: '6px 12px',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Plus size={14} />
                    <span>{t('shop.addArticleCmdBtn')}</span>
                  </button>
                </div>
              </div>

              {cmdLignes.length === 0 ? (
                <div
                  style={{
                    padding: 16,
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: 8,
                    textAlign: 'center',
                    fontSize: 13,
                    color: '#64748b',
                  }}
                >
                  {t('shop.emptyOrderLinesNotice')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {cmdLignes.map((ligne, idx) => {
                    const isCatalogProd =
                      produits.some((p) => p.id === ligne.produitId) && ligne.produitId !== 'custom'
                    const estCustom = !isCatalogProd || ligne.produitId === 'custom'

                    return (
                      <div
                        key={idx}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: 10,
                          padding: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                              {t('shop.articleDesignationCmdLabel')}{' '}
                              <span style={{ fontSize: 11, fontWeight: 500, color: '#6b7280' }}>
                                ({idx + 1})
                              </span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleSupprimerLigne(idx)}
                              style={{
                                background: '#fee2e2',
                                border: 'none',
                                color: '#ef4444',
                                padding: '4px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Trash2 size={12} />
                              <span>{t('shop.removeAttachmentBtn')}</span>
                            </button>
                          </div>

                          <SearchableProductSelect
                            produits={produits}
                            value={isCatalogProd ? ligne.produitId : 'custom'}
                            onChange={(pId) => handleModifierLigne(idx, 'produitId', pId)}
                            placeholder={t('shop.searchProductToOrderPrompt')}
                          />

                          {estCustom && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <input
                                type="text"
                                value={ligne.nomLibre || ''}
                                onChange={(e) => handleModifierLigne(idx, 'nomLibre', e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: '8px 10px',
                                  borderRadius: 6,
                                  border: '1px solid #0284c7',
                                  fontSize: 13,
                                  background: '#f0f9ff',
                                  color: '#0f172a',
                                }}
                                placeholder={t('shop.customItemNameCmdPlaceholder')}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => scanners.demarrerScannerNomCmd(idx)}
                                style={{
                                  background: '#e0f2fe',
                                  color: '#0369a1',
                                  border: '1px solid #bae6fd',
                                  borderRadius: 6,
                                  padding: '6px 10px',
                                  fontSize: 11.5,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                <Camera size={13} />
                                <span>{t('shop.scanNameCmdBtn')}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 10, alignItems: 'end' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                              {t('shop.quantityRequired')}
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={ligne.quantite}
                              onChange={(e) => handleModifierLigne(idx, 'quantite', Number(e.target.value))}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#ffffff' }}
                              placeholder={t('shop.quantityLabel')}
                              required
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                              {t('shop.unitPurchasePriceLabel')}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={ligne.prixAchat}
                              onChange={(e) => handleModifierLigne(idx, 'prixAchat', Number(e.target.value))}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13, background: '#ffffff' }}
                              placeholder={t('shop.unitPriceCmdPlaceholder')}
                              required
                            />
                          </div>

                          <div style={{ textAlign: 'right', paddingBottom: 6 }}>
                            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{t('shop.lineTotalCmdLabel')}</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--price, #0A5C36)' }}>
                              {fcfa((Number(ligne.quantite) || 0) * (Number(ligne.prixAchat) || 0))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #e5e7eb', paddingTop: 16, marginTop: 4 }}>
              <button
                type="button"
                onClick={onFermer}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'var(--price, #0A5C36)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <Check size={14} />
                <span>
                  {isSubmitting
                    ? commandeAEditer
                      ? t('shop.editingInProgress')
                      : t('shop.creatingInProgress')
                    : commandeAEditer
                      ? t('shop.saveOrderModificationsBtn')
                      : t('shop.createOrderConfirmBtn')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <ScannerFournisseursModals
        modalScannerEanCmd={scanners.modalScannerEanCmd}
        scannerEanStatusCmd={scanners.scannerEanStatusCmd}
        arreterScannerEanCmd={scanners.arreterScannerEanCmd}
        modalScannerNomCmd={scanners.modalScannerNomCmd}
        statusScannerNomCmd={scanners.statusScannerNomCmd}
        imageFligeeFournisseurNom={scanners.imageFligeeFournisseurNom}
        videoNomCmdRef={scanners.videoNomCmdRef}
        ocrLoadingCmd={scanners.ocrLoadingCmd}
        capturerNomOCRCmd={scanners.capturerNomOCRCmd}
        arreterScannerNomCmd={scanners.arreterScannerNomCmd}
        t={t}
      />
    </>
  )
}
