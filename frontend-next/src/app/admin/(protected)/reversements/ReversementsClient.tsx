'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Search,
} from 'lucide-react'
import { effectuerReversementWave, validerLotReversementsWave } from '@/app/actions/admin'
import { exportWaveBulkPaymentCSV, exportWaveBulkPaymentXLS } from '@/lib/export'
import { ReversementsKpiCards } from './components/ReversementsKpiCards'
import { ReversementsTable } from './components/ReversementsTable'
import { ModalConfirmerReversement, ReversementItem } from './components/ModalConfirmerReversement'

export default function ReversementsClient({
  initialReversements,
}: {
  initialReversements: ReversementItem[]
}) {
  const [items, setItems] = useState<ReversementItem[]>(initialReversements || [])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [validatingLot, setValidatingLot] = useState<boolean>(false)
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null)
  const [msgError, setMsgError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  // Modale confirmation
  const [itemToPay, setItemToPay] = useState<{
    item: ReversementItem
    mode: 'wave_api' | 'manuel'
  } | null>(null)

  const itemsFiltres = items.filter(i => {
    if (!q.trim()) return true
    const s = q.trim().toLowerCase()
    return (
      i.boutique_nom?.toLowerCase().includes(s) ||
      i.reference?.toLowerCase().includes(s) ||
      i.boutique_telephone?.includes(s) ||
      i.boutique_whatsapp?.includes(s) ||
      i.id.toLowerCase().includes(s)
    )
  })

  const isAllSelected = itemsFiltres.length > 0 && selectedIds.length === itemsFiltres.length

  function handleToggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(itemsFiltres.map(i => i.id))
    }
  }

  function handleToggleSelectRow(id: string) {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]))
  }

  function handleExportWaveBulkXLS() {
    const targets =
      selectedIds.length > 0 ? items.filter(i => selectedIds.includes(i.id)) : items

    if (targets.length === 0) return

    const bulkItems = targets.map(i => {
      const frais = Math.round(Number(i.montant_total) * 0.02)
      const net = Math.max(0, Number(i.montant_total) - (Number(i.montant_commission) || 0) - frais)
      return {
        reference: i.reference,
        boutique_nom: i.boutique_nom,
        mobile: i.boutique_whatsapp || i.boutique_telephone || '',
        montant_net: net,
      }
    })

    exportWaveBulkPaymentXLS('Export_Wave_Bulk_Paiement', bulkItems)
    setMsgSuccess(`Fichier Excel (.xls) Wave Bulk Payout généré pour ${targets.length} reversement(s) !`)
  }

  function handleExportWaveBulkCSV() {
    const targets =
      selectedIds.length > 0 ? items.filter(i => selectedIds.includes(i.id)) : items

    if (targets.length === 0) return

    const bulkItems = targets.map(i => {
      const frais = Math.round(Number(i.montant_total) * 0.02)
      const net = Math.max(0, Number(i.montant_total) - (Number(i.montant_commission) || 0) - frais)
      return {
        reference: i.reference,
        boutique_nom: i.boutique_nom,
        mobile: i.boutique_whatsapp || i.boutique_telephone || '',
        montant_net: net,
      }
    })

    exportWaveBulkPaymentCSV('Export_Wave_Bulk_Paiement', bulkItems)
    setMsgSuccess(`Fichier CSV Wave Bulk Payout généré pour ${targets.length} reversement(s) !`)
  }

  async function handleValiderLot() {
    if (selectedIds.length === 0) return
    const targets = items.filter(i => selectedIds.includes(i.id))
    const totalNet = targets.reduce((sum, i) => {
      const frais = Math.round(Number(i.montant_total) * 0.02)
      return sum + Math.max(0, Number(i.montant_total) - (Number(i.montant_commission) || 0) - frais)
    }, 0)

    if (
      !confirm(
        `Confirmer la validation et marquer ${targets.length} commande(s) comme REVERSÉE(S) (${totalNet.toLocaleString('fr-FR')} FCFA) ?\n\nCes éléments seront archivés de la liste des reversements en attente.`
      )
    ) {
      return
    }

    setValidatingLot(true)
    setMsgSuccess(null)
    setMsgError(null)

    try {
      const res = await validerLotReversementsWave(selectedIds)
      if (res.error) {
        setMsgError(`${res.error}`)
      } else {
        setMsgSuccess(
          `${targets.length} commande(s) marquée(s) comme reversée(s) avec succès ! (Total: ${totalNet.toLocaleString('fr-FR')} FCFA)`
        )
        setItems(prev => prev.filter(i => !selectedIds.includes(i.id)))
        setSelectedIds([])
      }
    } catch {
      setMsgError('Échec de la connexion au serveur.')
    } finally {
      setValidatingLot(false)
    }
  }

  async function executerPayement(item: ReversementItem, mode: 'wave_api' | 'manuel') {
    const frais = Math.round(Number(item.montant_total) * 0.02)
    const netAmount = Math.max(0, Number(item.montant_total) - (Number(item.montant_commission) || 0) - frais)
    const mobile = item.boutique_whatsapp || item.boutique_telephone

    setLoadingId(item.id)
    setMsgSuccess(null)
    setMsgError(null)
    setItemToPay(null)

    try {
      const res = await effectuerReversementWave(item.id, mode)
      if (res.error) {
        setMsgError(`${res.error}`)
      } else {
        const modeLabel = mode === 'manuel' ? 'Reversement manuel enregistré' : 'Virement Wave 1-Clic envoyé'
        setMsgSuccess(
          `${modeLabel} avec succès : ${netAmount.toLocaleString('fr-FR')} FCFA à ${item.boutique_nom} (${res.mobile || mobile}) ! (Réf: ${item.reference})`
        )
        setItems(prev => prev.filter(i => i.id !== item.id))
        setSelectedIds(prev => prev.filter(i => i !== item.id))
      }
    } catch {
      setMsgError('Échec de communication avec le serveur.')
    } finally {
      setLoadingId(null)
    }
  }

  // Calculs KPIs
  const totalNetGlobal = items.reduce((sum, i) => {
    const frais = Math.round(Number(i.montant_total) * 0.02)
    return sum + Math.max(0, Number(i.montant_total) - (Number(i.montant_commission) || 0) - frais)
  }, 0)

  const totalCommissionsGlobal = items.reduce((sum, i) => sum + (Number(i.montant_commission) || 0), 0)

  const selectedCount = selectedIds.length
  const selectedTargets = items.filter(i => selectedIds.includes(i.id))
  const selectedTotalNet = selectedTargets.reduce((sum, i) => {
    const frais = Math.round(Number(i.montant_total) * 0.02)
    return sum + Math.max(0, Number(i.montant_total) - (Number(i.montant_commission) || 0) - frais)
  }, 0)

  return (
    <div>
      {/* Cartes KPI Synthèse */}
      <ReversementsKpiCards
        totalNetGlobal={totalNetGlobal}
        totalCommandes={items.length}
        totalCommissionsGlobal={totalCommissionsGlobal}
      />

      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
          padding: 22,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {/* Barre d'Actions de Lot & Export */}
        {items.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 16px',
              background: '#F8F5F0',
              border: '1px solid #E8DDD2',
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            <div>
              <span style={{ fontWeight: 800, color: '#1C2B4A', fontSize: 14 }}>
                Reversements Groupés Wave
              </span>
              <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 2 }}>
                {selectedCount > 0
                  ? `${selectedCount} élément(s) sélectionné(s) · Net: ${selectedTotalNet.toLocaleString('fr-FR')} FCFA`
                  : `${items.length} reversement(s) Wave en attente au total`}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={handleExportWaveBulkXLS}
                style={{
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 14px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FileSpreadsheet size={15} />
                <span>Export Wave (.xls)</span>
              </button>

              <button
                onClick={handleExportWaveBulkCSV}
                style={{
                  background: '#38bdf8',
                  color: '#0f172a',
                  border: 'none',
                  padding: '9px 14px',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FileSpreadsheet size={15} />
                <span>Format CSV</span>
              </button>

              {selectedCount > 0 && (
                <button
                  onClick={handleValiderLot}
                  disabled={validatingLot}
                  style={{
                    background: validatingLot ? '#94a3b8' : '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 14px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: validatingLot ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span>{validatingLot ? 'Validation…' : `Marquer Reversé (${selectedCount})`}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {msgSuccess && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#166534',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CheckCircle2 size={16} />
            <span>{msgSuccess}</span>
          </div>
        )}

        {msgError && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{msgError}</span>
          </div>
        )}

        {/* Barre de recherche */}
        {items.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative', maxWidth: 440 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Rechercher par boutique, téléphone ou référence..."
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 38px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ('')}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tableau des Reversements */}
        <ReversementsTable
          items={itemsFiltres}
          selectedIds={selectedIds}
          isAllSelected={isAllSelected}
          loadingId={loadingId}
          q={q}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectRow={handleToggleSelectRow}
          onInitiatePayout={(item, mode) => setItemToPay({ item, mode })}
        />
      </div>

      {/* Modale de Confirmation de Paiement 1-Clic */}
      {itemToPay && (
        <ModalConfirmerReversement
          itemToPay={itemToPay}
          onClose={() => setItemToPay(null)}
          onConfirm={(item, mode) => executerPayement(item, mode)}
        />
      )}
    </div>
  )
}
