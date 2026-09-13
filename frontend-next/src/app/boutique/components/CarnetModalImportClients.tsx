'use client'

import React from 'react'
import { fcfa } from '@/lib/format'
import { Upload, FileSpreadsheet, X, Check, FileDown } from 'lucide-react'

export interface ClientImportData {
  nom: string
  telephone: string
  solde: number
  adresse?: string
}

interface CarnetModalImportClientsProps {
  isOpen: boolean
  onClose: () => void
  error: string | null
  success: string | null
  clientsAImporter: ClientImportData[]
  importing: boolean
  onDownloadModeleCSV: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onValiderImport: () => void
}

export default function CarnetModalImportClients({
  isOpen,
  onClose,
  error,
  success,
  clientsAImporter,
  importing,
  onDownloadModeleCSV,
  onFileUpload,
  onValiderImport,
}: CarnetModalImportClientsProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 580,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={20} style={{ color: 'var(--navy, #1C2B4A)' }} />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
              Importer des clients (CSV / Excel)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }}
            title="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: 10, fontSize: 14, fontWeight: 800 }}>
            {success}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 14px', borderRadius: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 800, color: '#9a3412' }}>Besoin d&apos;un modèle type ?</p>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#c2410c' }}>Nom, Téléphone, Dette initiale (FCFA), Adresse</p>
          </div>
          <button
            type="button"
            onClick={onDownloadModeleCSV}
            style={{
              background: 'var(--accent, #C75B00)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '7px 12px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileDown size={14} />
            <span>Télécharger modèle CSV</span>
          </button>
        </div>

        <div style={{ border: '2px dashed #93c5fd', background: '#eff6ff', borderRadius: 14, padding: '24px 16px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <Upload size={24} style={{ color: '#1e3a8a' }} />
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 800, color: '#1e3a8a' }}>
            Sélectionnez votre fichier (.CSV ou .TXT)
          </p>
          <input type="file" accept=".csv,.txt" onChange={onFileUpload} style={{ fontSize: 13 }} />
        </div>

        {clientsAImporter.length > 0 && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} style={{ color: '#16a34a' }} />
              <span>{clientsAImporter.length} client(s) détecté(s) :</span>
            </p>
            <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {clientsAImporter.slice(0, 5).map((c, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{c.nom} ({c.telephone})</span>
                  <span style={{ color: c.solde > 0 ? '#dc2626' : '#16a34a', fontWeight: 800 }}>
                    {c.solde > 0 ? `Dette : ${fcfa(c.solde)}` : 'Solde : 0 FCFA'}
                  </span>
                </div>
              ))}
              {clientsAImporter.length > 5 && (
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b', textAlign: 'center' }}>
                  ... et {clientsAImporter.length - 5} autre(s)
                </p>
              )}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 16px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: '#64748b' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onValiderImport}
            disabled={importing || clientsAImporter.length === 0}
            style={{
              padding: '10px 20px',
              background: clientsAImporter.length > 0 ? 'var(--navy, #1C2B4A)' : '#cbd5e1',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: clientsAImporter.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            {importing ? 'Importation en cours...' : `Valider l'import (${clientsAImporter.length})`}
          </button>
        </div>
      </div>
    </div>
  )
}
