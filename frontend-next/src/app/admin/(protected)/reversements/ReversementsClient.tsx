'use client'

import { useState } from 'react'
import { effectuerReversementWave, validerLotReversementsWave } from '@/app/actions/admin'
import { exportWaveBulkPaymentCSV, exportWaveBulkPaymentXLS } from '@/lib/export'

interface ReversementItem {
  id: string
  reference: string
  montant_total: number
  montant_commission: number
  methode_paiement: string
  statut: string
  created_at: string
  boutique_nom: string
  boutique_telephone: string
  boutique_whatsapp: string
  boutique_id: string
}

export default function ReversementsClient({ initialReversements }: { initialReversements: ReversementItem[] }) {
  const [items, setItems] = useState<ReversementItem[]>(initialReversements)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [validatingLot, setValidatingLot] = useState<boolean>(false)
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null)
  const [msgError, setMsgError] = useState<string | null>(null)
  const [q, setQ] = useState('')

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
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  function handleExportWaveBulkXLS() {
    const targets = selectedIds.length > 0
      ? items.filter(i => selectedIds.includes(i.id))
      : items

    if (targets.length === 0) return

    const bulkItems = targets.map(i => ({
      reference: i.reference,
      boutique_nom: i.boutique_nom,
      mobile: i.boutique_whatsapp || i.boutique_telephone || '',
      montant_net: Number(i.montant_total) - (Number(i.montant_commission) || 0)
    }))

    exportWaveBulkPaymentXLS('Export_Wave_Bulk_Paiement', bulkItems)
    setMsgSuccess(`📥 Fichier Excel (.xls) Wave Bulk Payout généré pour ${targets.length} reversement(s) !`)
  }

  function handleExportWaveBulkCSV() {
    const targets = selectedIds.length > 0
      ? items.filter(i => selectedIds.includes(i.id))
      : items

    if (targets.length === 0) return

    const bulkItems = targets.map(i => ({
      reference: i.reference,
      boutique_nom: i.boutique_nom,
      mobile: i.boutique_whatsapp || i.boutique_telephone || '',
      montant_net: Number(i.montant_total) - (Number(i.montant_commission) || 0)
    }))

    exportWaveBulkPaymentCSV('Export_Wave_Bulk_Paiement', bulkItems)
    setMsgSuccess(`📥 Fichier CSV Wave Bulk Payout généré pour ${targets.length} reversement(s) !`)
  }

  async function handleValiderLot() {
    if (selectedIds.length === 0) return
    const targets = items.filter(i => selectedIds.includes(i.id))
    const totalNet = targets.reduce((sum, i) => sum + (Number(i.montant_total) - (Number(i.montant_commission) || 0)), 0)

    if (!confirm(`Confirmer la validation et marquer ${targets.length} commande(s) comme REVERSÉE(S) (${totalNet.toLocaleString('fr-FR')} FCFA) ?\n\nCes éléments seront retirés de la liste des versements en attente.`)) {
      return
    }

    setValidatingLot(true)
    setMsgSuccess(null)
    setMsgError(null)

    try {
      const res = await validerLotReversementsWave(selectedIds)
      if (res.error) {
        setMsgError(`❌ ${res.error}`)
      } else {
        setMsgSuccess(`✅ ${targets.length} commande(s) marquée(s) comme reversée(s) avec succès ! (Total: ${totalNet.toLocaleString('fr-FR')} FCFA)`)
        setItems(prev => prev.filter(i => !selectedIds.includes(i.id)))
        setSelectedIds([])
      }
    } catch {
      setMsgError('❌ Échec de la connexion au serveur.')
    } finally {
      setValidatingLot(false)
    }
  }

  async function validerPayement1Clic(item: ReversementItem) {
    const netAmount = Number(item.montant_total) - (Number(item.montant_commission) || 0)
    const mobile = item.boutique_whatsapp || item.boutique_telephone

    if (!confirm(`Confirmer le reversement de ${netAmount.toLocaleString('fr-FR')} FCFA à ${item.boutique_nom} (${mobile}) ?`)) {
      return
    }

    setLoadingId(item.id)
    setMsgSuccess(null)
    setMsgError(null)

    try {
      const res = await effectuerReversementWave(item.id)
      if (res.error) {
        setMsgError(`❌ ${res.error}`)
      } else {
        setMsgSuccess(`✅ ${netAmount.toLocaleString('fr-FR')} FCFA transférés avec succès à ${item.boutique_nom} (${res.mobile || mobile}) ! Ref: payout_${item.reference}`)
        setItems(prev => prev.filter(i => i.id !== item.id))
        setSelectedIds(prev => prev.filter(i => i !== item.id))
      }
    } catch {
      setMsgError('❌ Échec de la connexion au serveur.')
    } finally {
      setLoadingId(null)
    }
  }

  const selectedCount = selectedIds.length
  const selectedTargets = items.filter(i => selectedIds.includes(i.id))
  const selectedTotalNet = selectedTargets.reduce((sum, i) => sum + (Number(i.montant_total) - (Number(i.montant_commission) || 0)), 0)

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {items.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          marginBottom: 16
        }}>
          <div>
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
              🌊 Paiement en Masse Wave
            </span>
            <span style={{ display: 'block', fontSize: 12, color: '#64748b' }}>
              {selectedCount > 0
                ? `${selectedCount} élément(s) sélectionné(s) · Net: ${selectedTotalNet.toLocaleString('fr-FR')} FCFA`
                : `${items.length} reversement(s) en attente au total`}
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
                gap: 6
              }}
            >
              📥 Exporter pour Wave (.xls / Excel)
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
                gap: 6
              }}
            >
              📄 Format CSV
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
                  gap: 6
                }}
              >
                {validatingLot ? '⏳ Validation du lot…' : `✅ Marquer la sélection comme Reversée (${selectedCount})`}
              </button>
            )}
          </div>
        </div>
      )}

      {msgSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
          {msgSuccess}
        </div>
      )}
      {msgError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
          {msgError}
        </div>
      )}

      {/* Barre de recherche */}
      {items.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', maxWidth: 400 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher par nom de boutique, téléphone ou référence..."
              style={{
                width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8,
                border: '1px solid #cbd5e1', fontSize: 13, outline: 'none'
              }}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#94a3b8', fontSize: 14, cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {itemsFiltres.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>{q ? '🔍' : '✅'}</span>
          <p style={{ fontWeight: 600, fontSize: 16 }}>
            {q ? 'Aucun reversement ne correspond à votre recherche.' : 'Aucun reversement marchand en attente !'}
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>
            {q ? 'Essayez avec un autre nom de boutique ou numéro de téléphone.' : 'Toutes les commandes livrées payées via Wave ont été réglées aux vendeurs.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', width: 40 }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Réf. Commande</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Boutique &amp; Contact</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Total Recouvré</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Commission</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#166534' }}>Net Vendeur</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Action 1-Clic</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltres.map(item => {
                const netAmount = Number(item.montant_total) - (Number(item.montant_commission) || 0)
                const mobile = item.boutique_whatsapp || item.boutique_telephone
                const isPending = loadingId === item.id
                const isSelected = selectedIds.includes(item.id)

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: isSelected ? '#f0f9ff' : 'transparent' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(item.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1e293b' }}>
                      {item.reference}
                      <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a', display: 'block' }}>{item.boutique_nom}</span>
                      <span style={{ fontSize: 12, color: '#2563eb', fontWeight: 600 }}>📞 {mobile || 'Non renseigné'}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#334155' }}>
                      {Number(item.montant_total).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td style={{ padding: '14px 16px', color: '#dc2626', fontWeight: 600 }}>
                      - {Number(item.montant_commission || 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#15803d', fontSize: 15 }}>
                      {netAmount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => validerPayement1Clic(item)}
                        disabled={isPending}
                        style={{
                          background: isPending ? '#94a3b8' : '#1d4ed8',
                          color: '#fff',
                          border: 'none',
                          padding: '10px 16px',
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: isPending ? 'not-allowed' : 'pointer',
                          boxShadow: isPending ? 'none' : '0 2px 8px rgba(29,78,216,0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        {isPending ? '⏳ Payout Wave en cours…' : '🌊 Reversement 1-Clic Wave'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
