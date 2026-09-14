'use client'

import React from 'react'
import { fcfa } from '@/lib/format'
import { useScrollNudge } from '@/hooks/useScrollNudge'
import type { DocumentBoutique } from './types'

interface GestionDocumentsTableProps {
  boutiqueId: string
  documentsFiltres: DocumentBoutique[]
  clients: any[]
  loading: boolean
  rechercheDoc: string
  setRechercheDoc: (val: string) => void
  typeFiltre: string
  setTypeFiltre: (val: string) => void
  statutFiltreDoc: string
  setStatutFiltreDoc: (val: string) => void
  onNouveauDocument: () => void
  onOuvrirEdition: (doc: DocumentBoutique) => void
  onConvertirEnFacture: (docId: string, ref: string) => void
  onSupprimerDocument: (docId: string, ref: string) => void
  t: (key: string) => string
}

export default function GestionDocumentsTable({
  boutiqueId,
  documentsFiltres,
  clients,
  loading,
  rechercheDoc,
  setRechercheDoc,
  typeFiltre,
  setTypeFiltre,
  statutFiltreDoc,
  setStatutFiltreDoc,
  onNouveauDocument,
  onOuvrirEdition,
  onConvertirEnFacture,
  onSupprimerDocument,
  t,
}: GestionDocumentsTableProps) {
  const { scrollRef: docFilterRef, scrollToCenter: scrollDocToCenter } = useScrollNudge()

  return (
    <>
      {/* Barre d'outils et filtres */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1, minWidth: 280 }}>
          <input
            type="text"
            value={rechercheDoc}
            onChange={(e) => setRechercheDoc(e.target.value)}
            placeholder={`${t('common.search')}...`}
            style={{
              padding: '7px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              minWidth: 200,
              flex: 1,
              outline: 'none',
            }}
          />
          <div
            ref={docFilterRef}
            className="nopalou-scroll-tabs horizontal-scroll-fade"
            style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
          >
            {[
              { key: 'tous', label: `📁 ${t('shop.filterDocAll')}` },
              { key: 'facture', label: `${t('shop.filterDocInvoices')}` },
              { key: 'devis', label: `📝 ${t('shop.filterDocQuotes')}` },
              { key: 'proforma', label: `${t('shop.filterDocProformas')}` },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={(e) => {
                  setTypeFiltre(item.key)
                  scrollDocToCenter(e.currentTarget)
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  background: typeFiltre === item.key ? '#1e3a5f' : '#ffffff',
                  color: typeFiltre === item.key ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <select
            value={statutFiltreDoc}
            onChange={(e) => setStatutFiltreDoc(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              background: '#fff',
              outline: 'none',
            }}
          >
            <option value="tous">{t('common.all')}</option>
            <option value="brouillon">{t('shop.statusDraft')}</option>
            <option value="valide">{t('shop.statusValidated')}</option>
            <option value="paye">{t('shop.statusPaid')}</option>
            <option value="envoye">📩 {t('shop.statusShipped')}</option>
          </select>
        </div>
        <button
          type="button"
          onClick={onNouveauDocument}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {t('shop.newDocumentBtn')}
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280', fontSize: 14 }}>{t('common.loading')}</p>
      ) : documentsFiltres.length === 0 ? (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '40px 20px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          📂 {t('common.noData')}
        </div>
      ) : (
        <div
          style={{
            overflowX: 'auto',
            background: '#ffffff',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: 13, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t('shop.orderReference')}
                </th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t('shop.documentType')}
                </th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t('shop.documentClient')}
                </th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t('shop.subtotalHt')}
                </th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t('shop.vatAmount')}
                </th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t('shop.totalTtc')}
                </th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t('shop.orderStatus')}
                </th>
                <th style={{ padding: '12px 14px', color: '#374151', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {documentsFiltres.map((doc) => {
                const client = clients.find((c) => c.id === doc.client_id)
                return (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: 12, fontWeight: 700, color: '#1e3a5f' }}>{doc.reference}</td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: '3px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            doc.type === 'facture' ? '#e0f2fe' : doc.type === 'devis' ? '#fef3c7' : '#ecfdf5',
                          color: doc.type === 'facture' ? '#0369a1' : doc.type === 'devis' ? '#b45309' : '#047857',
                        }}
                      >
                        {doc.type.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>{client ? client.nom : t('shop.anonymousWalkInClient')}</td>
                    <td style={{ padding: 12 }}>{fcfa(doc.total_ht)}</td>
                    <td style={{ padding: 12 }}>{fcfa(doc.total_tva)}</td>
                    <td style={{ padding: 12, fontWeight: 700 }}>{fcfa(doc.total_ttc)}</td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: '3px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            doc.statut === 'paye' ? '#d1fae5' : doc.statut === 'valide' ? '#e0e7ff' : '#f3f4f6',
                          color:
                            doc.statut === 'paye' ? '#065f46' : doc.statut === 'valide' ? '#3730a3' : '#374151',
                        }}
                      >
                        {doc.statut.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <select
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === 'pdf_moderne' || val === 'pdf') {
                            window.open(
                              `/api/boutiques/${boutiqueId}/documents/${doc.id}/pdf?modele=moderne`,
                              '_blank'
                            )
                          } else if (val === 'pdf_institutionnel') {
                            window.open(
                              `/api/boutiques/${boutiqueId}/documents/${doc.id}/pdf?modele=institutionnel`,
                              '_blank'
                            )
                          } else if (val === 'edit') {
                            onOuvrirEdition(doc)
                          } else if (val === 'convert') {
                            onConvertirEnFacture(doc.id, doc.reference)
                          } else if (val === 'delete') {
                            onSupprimerDocument(doc.id, doc.reference)
                          }
                          e.target.value = ''
                        }}
                        defaultValue=""
                        style={{
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          color: '#0f172a',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="" disabled>
                          {t('shop.docActionsDropdown')}
                        </option>
                        <option value="pdf_moderne">PDF Moderne Épuré</option>
                        <option value="pdf_institutionnel">PDF Institutionnel OHADA</option>
                        <option value="edit">{t('shop.actionEditDoc')}</option>
                        {(doc.type === 'devis' || doc.type === 'proforma') && (
                          <option value="convert">{t('shop.actionConvertToInvoice')}</option>
                        )}
                        <option value="delete">{t('shop.actionDeleteDoc')}</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
