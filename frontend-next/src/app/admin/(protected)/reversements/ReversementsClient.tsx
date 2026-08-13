'use client'

import { useState } from 'react'
import { effectuerReversementWave } from '@/app/actions/admin'

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
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null)
  const [msgError, setMsgError] = useState<string | null>(null)

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
      }
    } catch {
      setMsgError('❌ Échec de la connexion au serveur.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
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

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#6b7280' }}>
          <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>✅</span>
          <p style={{ fontWeight: 600, fontSize: 16 }}>Aucun reversement marchand en attente !</p>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Toutes les commandes livrées payées via Wave ont été réglées aux vendeurs.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Réf. Commande</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Boutique &amp; Contact</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Total Recouvré</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>Commission</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#166534' }}>Net Vendeur</th>
                <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Action 1-Clic</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const netAmount = Number(item.montant_total) - (Number(item.montant_commission) || 0)
                const mobile = item.boutique_whatsapp || item.boutique_telephone
                const isPending = loadingId === item.id

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
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
