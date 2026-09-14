'use client'

import React from 'react'
import { Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, X } from 'lucide-react'
import type { LigneFichier, DiagnosticImport } from './types'

interface BatchImportFileViewProps {
  nomFichier: string | null
  diagnostic: DiagnosticImport | null
  lignesFichier: LigneFichier[]
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearFile: () => void
  onDownloadTemplate: () => void
}

export default function BatchImportFileView({
  nomFichier,
  diagnostic,
  lignesFichier,
  onFileUpload,
  onClearFile,
  onDownloadTemplate,
}: BatchImportFileViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Bannière de téléchargement du modèle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#FFFDF9',
          border: '1.5px solid #FED7AA',
          padding: '14px 18px',
          borderRadius: 14,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 13.5, color: '#9A3412' }}>
            Vous partez de zéro ou d&apos;un carnet papier ?
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: '#C2410C' }}>
            Téléchargez notre modèle de tableau simplifié pré-rempli avec des exemples.
          </p>
        </div>
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="btn-npl btn-npl-secondary btn-npl-sm"
          style={{
            borderColor: '#FED7AA',
            color: '#9A3412',
            background: '#FFF7ED',
            fontWeight: 800,
            cursor: 'pointer',
            padding: '8px 14px',
            borderRadius: 8,
          }}
        >
          Télécharger le modèle (.CSV)
        </button>
      </div>

      {/* Zone Glisser-Déposer File Input */}
      <div
        style={{
          border: '2px dashed #93C5FD',
          background: '#EFF6FF',
          borderRadius: 16,
          padding: '30px 20px',
          textAlign: 'center',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: '#DBEAFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            color: '#1D4ED8',
          }}
        >
          <Upload size={24} />
        </div>
        <h3 style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 16, color: '#1E3A8A' }}>
          Déposez votre fichier ici (Excel, CSV, Shopify, WooCommerce)
        </h3>
        <p
          style={{
            margin: '0 0 16px',
            fontSize: 13,
            color: '#3B82F6',
            maxWidth: 480,
            marginInline: 'auto',
          }}
        >
          Nopalou détecte automatiquement vos colonnes (Nom, Prix, Stock, Catégorie) sans aucune
          configuration technique requise.
        </p>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#1D4ED8',
            color: '#ffffff',
            padding: '10px 22px',
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(29,78,216,0.25)',
          }}
        >
          <span>Choisir un fichier</span>
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={onFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        {nomFichier && (
          <p style={{ margin: '12px 0 0', fontSize: 12, fontWeight: 700, color: '#1E40AF' }}>
            Fichier sélectionné : {nomFichier}
          </p>
        )}
      </div>

      {/* Diagnostic & Prévisualisation */}
      {diagnostic && lignesFichier.length > 0 && (
        <div
          style={{
            background: '#fff',
            border: '1.5px solid #E2E8F0',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 900, fontSize: 15, color: '#0F172A' }}>
                  {diagnostic.totalDetecte} articles détectés
                </span>
                <span
                  style={{
                    background: '#EFF6FF',
                    color: '#1D4ED8',
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {diagnostic.plateforme}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B' }}>
                ✓ {diagnostic.prets} prêts à être importés{' '}
                {diagnostic.avertissements > 0 ? `· ${diagnostic.avertissements} sans prix` : ''}
              </p>
            </div>
            <button
              onClick={onClearFile}
              style={{
                fontSize: 12,
                color: '#DC2626',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <X size={14} />
              <span>Supprimer la sélection</span>
            </button>
          </div>

          {/* Tableau d'aperçu des premiers articles */}
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12.5,
                textAlign: 'left',
              }}
            >
              <thead>
                <tr
                  style={{
                    background: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    color: '#475569',
                    fontWeight: 750,
                  }}
                >
                  <th style={{ padding: '8px 12px' }}>Nom du produit</th>
                  <th style={{ padding: '8px 12px' }}>Prix FCFA</th>
                  <th style={{ padding: '8px 12px' }}>Stock</th>
                  <th style={{ padding: '8px 12px' }}>Catégorie</th>
                  <th style={{ padding: '8px 12px' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {lignesFichier.slice(0, 6).map((l, idx) => (
                  <tr
                    key={l.id}
                    style={{ borderBottom: idx < 5 ? '1px solid #F1F5F9' : 'none' }}
                  >
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1E293B' }}>
                      {l.nom}
                    </td>
                    <td
                      style={{
                        padding: '9px 12px',
                        fontWeight: 800,
                        color: l.prix > 0 ? '#16A34A' : '#D97706',
                      }}
                    >
                      {l.prix.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td style={{ padding: '9px 12px', color: '#64748B' }}>{l.quantite}</td>
                    <td
                      style={{
                        padding: '9px 12px',
                        color: '#64748B',
                        textTransform: 'capitalize',
                      }}
                    >
                      {l.categorie}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {l.prix > 0 ? (
                        <span
                          style={{
                            color: '#16A34A',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <CheckCircle2 size={13} />
                          <span>Prêt</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            color: '#D97706',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <AlertTriangle size={12} />
                          <span>Sans prix</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {lignesFichier.length > 6 && (
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 11.5,
                color: '#94A3B8',
                textAlign: 'center',
              }}
            >
              ... et {lignesFichier.length - 6} autres articles prêts à être importés
            </p>
          )}
        </div>
      )}
    </div>
  )
}
