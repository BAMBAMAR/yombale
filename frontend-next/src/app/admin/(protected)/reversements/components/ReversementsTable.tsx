import React from 'react'
import { CheckCircle2, MessageCircle, Send } from 'lucide-react'
import { ReversementItem } from './ModalConfirmerReversement'

interface ReversementsTableProps {
  items: ReversementItem[]
  selectedIds: string[]
  isAllSelected: boolean
  loadingId: string | null
  q: string
  onToggleSelectAll: () => void
  onToggleSelectRow: (id: string) => void
  onInitiatePayout: (item: ReversementItem, mode: 'wave_api' | 'manuel') => void
}

export function ReversementsTable({
  items,
  selectedIds,
  isAllSelected,
  loadingId,
  q,
  onToggleSelectAll,
  onToggleSelectRow,
  onInitiatePayout,
}: ReversementsTableProps) {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: '#f1f5f9',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}
        >
          <CheckCircle2 size={24} color="#16a34a" />
        </div>
        <p style={{ fontWeight: 700, fontSize: 16, color: '#1e293b', margin: '0 0 6px' }}>
          {q ? 'Aucun résultat correspondant à votre recherche' : 'Aucun reversement marchand en attente'}
        </p>
        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
          {q
            ? 'Essayez avec un autre mot-clé ou réinitialisez la barre de recherche.'
            : 'Toutes les commandes en ligne encaissées par Wave ont été reversées aux commerçants.'}
        </p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
            <th style={{ padding: '12px 14px', width: 36 }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
            </th>
            <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Réf. Commande</th>
            <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Boutique & Contact Wave</th>
            <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Total Encaissé</th>
            <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569' }}>Commission</th>
            <th style={{ padding: '12px 14px', fontWeight: 700, color: '#0A5C36' }}>Net Vendeur</th>
            <th style={{ padding: '12px 14px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>
              Action Immédiate
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => {
            const frais = Math.round(Number(item.montant_total) * 0.02)
            const netAmount = Math.max(0, Number(item.montant_total) - (Number(item.montant_commission) || 0) - frais)
            const mobile = item.boutique_whatsapp || item.boutique_telephone
            const cleanMobile = mobile ? String(mobile).replace(/\D/g, '') : ''
            const isPending = loadingId === item.id
            const isSelected = selectedIds.includes(item.id)

            return (
              <tr
                key={item.id}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: isSelected ? '#f0f9ff' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                <td style={{ padding: '14px' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelectRow(item.id)}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                </td>

                <td style={{ padding: '14px', fontWeight: 700, color: '#1e293b' }}>
                  <div>{item.reference}</div>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>
                    {new Date(item.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </td>

                <td style={{ padding: '14px' }}>
                  <span style={{ fontWeight: 800, color: '#0f172a', display: 'block' }}>{item.boutique_nom}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 700 }}>
                      {mobile || 'Numéro manquant'}
                    </span>
                    {cleanMobile && (
                      <a
                        href={`https://wa.me/${cleanMobile.startsWith('221') ? cleanMobile : '221' + cleanMobile}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Contacter sur WhatsApp"
                        style={{ color: '#25D366', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </div>
                </td>

                <td style={{ padding: '14px', fontWeight: 600, color: '#334155' }}>
                  {Number(item.montant_total).toLocaleString('fr-FR')} FCFA
                </td>

                <td style={{ padding: '14px', color: '#dc2626', fontWeight: 600 }}>
                  - {Number(item.montant_commission || 0).toLocaleString('fr-FR')} FCFA
                </td>

                <td style={{ padding: '14px', fontWeight: 900, color: '#0A5C36', fontSize: 15 }}>
                  {netAmount.toLocaleString('fr-FR')} FCFA
                </td>

                <td style={{ padding: '14px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <button
                      onClick={() => onInitiatePayout(item, 'wave_api')}
                      disabled={isPending || !mobile}
                      style={{
                        background: isPending ? '#94a3b8' : '#1d4ed8',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: isPending || !mobile ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 6px rgba(29,78,216,0.2)',
                      }}
                    >
                      <Send size={13} />
                      <span>{isPending ? 'Payout en cours…' : 'Wave 1-Clic'}</span>
                    </button>

                    <button
                      onClick={() => onInitiatePayout(item, 'manuel')}
                      disabled={isPending}
                      title="Marquer comme reversé hors-ligne"
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        padding: '8px 10px',
                        borderRadius: 8,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: isPending ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Hors-Ligne
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
