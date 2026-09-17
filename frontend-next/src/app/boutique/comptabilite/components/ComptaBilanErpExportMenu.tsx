'use client'

import React, { useState } from 'react'
import { Building2, FileSpreadsheet, FileText, Database, ChevronDown } from 'lucide-react'
import { listVentes, listDepenses } from '../../actions'
import {
  exportSageCSV,
  exportFEC,
  exportOdooJSON,
  genererEcrituresSyscohada,
  type TransactionComptable
} from '@/lib/syscohada-export'
import { showToast } from '@/context/ToastContext'

interface ComptaBilanErpExportMenuProps {
  boutiqueId: string
  boutiqueNom: string
}

export function ComptaBilanErpExportMenu({
  boutiqueId,
  boutiqueNom,
}: ComptaBilanErpExportMenuProps) {
  const [menuErpOuvert, setMenuErpOuvert] = useState(false)
  const [exportantErp, setExportantErp] = useState(false)

  const handleExportErp = async (format: 'sage' | 'fec' | 'odoo') => {
    setExportantErp(true)
    try {
      const [ventesRes, depensesRes] = await Promise.all([
        listVentes(boutiqueId),
        listDepenses(boutiqueId)
      ])
      const ventesList = Array.isArray(ventesRes) ? ventesRes : []
      const depensesList = Array.isArray(depensesRes) ? depensesRes : []

      const transactions: TransactionComptable[] = [
        ...ventesList.map((v: any) => ({
          id: String(v.id || v.reference || Math.random()),
          date: v.created_at || new Date().toISOString(),
          reference: v.reference,
          clientNom: v.client_nom,
          montantTotal: Number(v.montant_total) || 0,
          modePaiement: v.methode_paiement || 'cash',
          type: 'vente' as const,
          libelle: `Vente ${v.nom_produit || 'Marchandise'} x${v.quantite || 1}`,
        })),
        ...depensesList.map((d: any) => ({
          id: String(d.id || Math.random()),
          date: d.date_depense || new Date().toISOString(),
          montantTotal: Number(d.montant) || 0,
          modePaiement: 'cash',
          type: 'depense' as const,
          libelle: d.description || `Dépense ${d.categorie || 'exploitation'}`,
        }))
      ]

      const ecritures = genererEcrituresSyscohada(transactions, 'simplifie')
      const baseFilename = `SYSCOHADA_${boutiqueNom.replace(/\s+/g, '_')}`

      if (format === 'sage') {
        exportSageCSV(ecritures, `${baseFilename}_SAGE`)
      } else if (format === 'fec') {
        exportFEC(ecritures, `${baseFilename}_FEC`)
      } else if (format === 'odoo') {
        exportOdooJSON(ecritures, boutiqueNom)
      }
      showToast("Export ERP (OHADA) généré avec succès !", 'success', 'Export Comptable')
    } catch (err) {
      console.error('[Comptabilite] Erreur export ERP:', err)
      showToast("Erreur lors de la génération de l'export ERP.", 'error', 'Export Comptable')
    } finally {
      setExportantErp(false)
      setMenuErpOuvert(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setMenuErpOuvert(!menuErpOuvert)}
        disabled={exportantErp}
        style={{
          padding: '8px 14px', borderRadius: 8,
          border: '1.5px solid #1d4ed8', background: '#eff6ff',
          color: '#1d4ed8', fontSize: 12.5, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 1px 3px rgba(29,78,216,0.1)'
        }}
      >
        <Building2 size={15} color="#1d4ed8" />
        <span>{exportantErp ? 'Export...' : 'Exports ERP (OHADA)'}</span>
        <ChevronDown size={14} color="#1d4ed8" />
      </button>

      {menuErpOuvert && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)', zIndex: 50,
          minWidth: 260, overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Norme SYSCOHADA Révisée
          </div>
          <button
            type="button"
            onClick={() => handleExportErp('sage')}
            style={{ padding: '10px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 12.5, color: '#0f172a', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <FileSpreadsheet size={16} color="#059669" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Sage Saari (.csv)</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Grand Livre &amp; Journal des ventes</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleExportErp('fec')}
            style={{ padding: '10px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 12.5, color: '#0f172a', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, borderTop: '1px solid #f1f5f9' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <FileText size={16} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>FEC Standard (.txt)</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Fichier des Écritures Comptables</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleExportErp('odoo')}
            style={{ padding: '10px 14px', border: 'none', background: 'transparent', textAlign: 'left', fontSize: 12.5, color: '#0f172a', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, borderTop: '1px solid #f1f5f9' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Database size={16} color="#7c3aed" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Odoo Accounting (.json)</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Pièces comptables &amp; partenaires</div>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
