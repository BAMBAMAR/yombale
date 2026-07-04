'use client'
import { useState, useTransition } from 'react'
import { devenirApporteur, type StatsApporteur } from './actions'
import { fcfa } from '@/lib/format'

export default function ApporteurClient({ statsInitiales }: { statsInitiales: StatsApporteur | null }) {
  const [stats, setStats] = useState(statsInitiales)
  const [isPending, startTransition] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  function activer() {
    setErreur(null)
    startTransition(async () => {
      const result = await devenirApporteur()
      if (result.error) { setErreur(result.error); return }
      // Recharger les stats complètes après activation
      const { getMesStatsApporteur } = await import('./actions')
      const fraiches = await getMesStatsApporteur()
      setStats(fraiches)
    })
  }

  if (!stats) {
    return (
      <div>
        {erreur && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
            {erreur}
          </div>
        )}
        <button
          onClick={activer}
          disabled={isPending}
          style={{ padding: '12px 32px', background: isPending ? '#9ca3af' : '#C75B00', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: isPending ? 'not-allowed' : 'pointer' }}
        >
          {isPending ? 'Activation...' : 'Devenir apporteur d\'affaires'}
        </button>
      </div>
    )
  }

  const lien = `https://nopalou.com/boutique?apporteur=${stats.code_apporteur}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 20 }}>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 6px' }}>Votre code apporteur</p>
        <p style={{ fontSize: 24, fontWeight: 900, color: '#C75B00', margin: '0 0 12px' }}>{stats.code_apporteur}</p>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 6px' }}>Lien à partager</p>
        <code style={{ fontSize: 13, background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, display: 'block' }}>{lien}</code>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>Commission due</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#1C2B4A', margin: 0 }}>{fcfa(stats.total_du)}</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: 16 }}>
          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 4px' }}>Déjà payé</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', margin: 0 }}>{fcfa(stats.total_paye)}</p>
        </div>
      </div>

      <p style={{ fontSize: 12, color: '#94A3B8' }}>
        Taux de commission actuel : {stats.taux_commission}% · Règlement à partir de {fcfa(stats.seuil_paiement)} cumulés
      </p>

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Boutiques recrutées ({stats.boutiques.length})</h3>
        {stats.boutiques.length === 0 ? (
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Aucune boutique recrutée pour l&apos;instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stats.boutiques.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 14 }}>
                <span>{b.nom}</span>
                <span style={{ color: b.abonnement_statut === 'actif' ? '#16a34a' : '#94A3B8' }}>
                  {b.plan ? `${b.plan} — ${b.abonnement_statut ?? 'inactif'}` : 'Sans abonnement'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
