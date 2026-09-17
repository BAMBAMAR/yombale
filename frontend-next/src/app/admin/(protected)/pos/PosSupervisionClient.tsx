'use client'

import { useState } from 'react'
import {
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
  ArrowUpRight,
  Receipt,
  Store,
  Clock,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import { adminFermerSessionPOS } from '@/app/actions/admin'

interface PosSupervisionClientProps {
  initialStats: any
  initialSessions: any[]
}

export default function PosSupervisionClient({ initialStats, initialSessions }: PosSupervisionClientProps) {
  const [sessions, setSessions] = useState(initialSessions)
  const [filterStatut, setFilterStatut] = useState<'tous' | 'ouverte' | 'ecart'>('tous')
  const [search, setSearch] = useState('')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  const handleForceCloture = async (sessionId: string) => {
    if (!confirm('Confirmer la fermeture administrative forcée de cette session de caisse ?')) return
    setLoadingAction(sessionId)
    try {
      const res = await adminFermerSessionPOS(sessionId, { notes: 'Fermeture forcée depuis le Control Center' })
      if (res.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, statut: 'fermee', ecart: 0 } : s))
        )
      } else {
        alert(res.error || 'Erreur lors de la clôture')
      }
    } finally {
      setLoadingAction(null)
    }
  }

  const filteredSessions = sessions.filter((s) => {
    if (filterStatut === 'ouverte' && s.statut !== 'ouverte') return false
    if (filterStatut === 'ecart' && (s.statut !== 'fermee' || Number(s.ecart) === 0)) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const matchBoutique = s.boutique_nom?.toLowerCase().includes(q)
      const matchCaissier = s.caissier_nom?.toLowerCase().includes(q)
      if (!matchBoutique && !matchCaissier) return false
    }
    return true
  })

  const vStats = initialStats?.ventes || {}
  const sStats = initialStats?.sessions || {}

  return (
    <div className="admin-page-container">
      {/* En-tête Métier */}
      <div className="admin-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
            Réseau Point de Vente & Caisses (POS)
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Supervision temps réel des terminaux d&apos;encaissement, sessions actives et intégrité de clôture.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-npl"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}
        >
          <RefreshCw size={14} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Cartes KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Volume Encaissements (30j)</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '8px 0 4px' }}>
            {fcfa(vStats.volumeTotal || 0)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--price)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Receipt size={13} />
            <span>{vStats.totalTickets || 0} tickets enregistrés</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Caisses Ouvertes en Direct</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', margin: '8px 0 4px' }}>
            {sStats.ouvertes || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Store size={13} />
            <span>{vStats.boutiquesActives || 0} boutiques actives</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Clôtures avec Écart</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: sStats.cloturesAvecEcart > 0 ? '#ef4444' : 'var(--navy)', margin: '8px 0 4px' }}>
            {sStats.cloturesAvecEcart || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Écarts cumulés: {fcfa(sStats.totalEcartsCumules || 0)}
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Mix Paiements POS</span>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text2)', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div>Espèces: <strong>{fcfa(vStats.volumeEspeces || 0)}</strong></div>
            <div>Wave: <strong>{fcfa(vStats.volumeWave || 0)}</strong></div>
            <div>Orange Money: <strong>{fcfa(vStats.volumeOrange || 0)}</strong></div>
          </div>
        </div>
      </div>

      {/* Barre de Filtres & Recherche */}
      <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setFilterStatut('tous')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStatut === 'tous' ? 'var(--navy)' : '#ffffff',
              color: filterStatut === 'tous' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            Toutes les sessions ({sessions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatut('ouverte')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStatut === 'ouverte' ? 'var(--navy)' : '#ffffff',
              color: filterStatut === 'ouverte' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            Caisses ouvertes ({sessions.filter((s) => s.statut === 'ouverte').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatut('ecart')}
            style={{
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: filterStatut === 'ecart' ? 'var(--navy)' : '#ffffff',
              color: filterStatut === 'ecart' ? '#ffffff' : 'var(--text1)',
              cursor: 'pointer',
            }}
          >
            Écarts de caisse
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder="Filtrer boutique, caissier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '7px 12px 7px 32px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tableau des Sessions */}
      <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <th style={{ padding: '12px 16px' }}>Boutique & Caissier</th>
                <th style={{ padding: '12px 16px' }}>Statut</th>
                <th style={{ padding: '12px 16px' }}>Ouverture</th>
                <th style={{ padding: '12px 16px' }}>Fond Initial</th>
                <th style={{ padding: '12px 16px' }}>Encaissé Réel</th>
                <th style={{ padding: '12px 16px' }}>Écart Clôture</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)' }}>
                    Aucune session de caisse correspondant aux critères.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const isOuverte = session.statut === 'ouverte'
                  const ecartNum = Number(session.ecart) || 0

                  return (
                    <tr key={session.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{session.boutique_nom}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          Caissier : {session.caissier_nom || 'Administrateur'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isOuverte ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#10b981', background: '#ecfdf5', padding: '3px 8px', borderRadius: 12 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                            En direct
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: 'var(--text3)', background: '#f1f5f9', padding: '3px 8px', borderRadius: 12 }}>
                            <CheckCircle2 size={12} />
                            Fermée
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', fontSize: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} color="var(--text3)" />
                          {new Date(session.ouvert_le).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text1)' }}>
                        {fcfa(session.fond_initial || 0)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--navy)' }}>
                        {fcfa(session.total_reel_compte || session.total_attendu || 0)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {isOuverte ? (
                          <span style={{ color: 'var(--text3)', fontSize: 12 }}>En cours</span>
                        ) : ecartNum === 0 ? (
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: 12 }}>0 FCFA (Parfait)</span>
                        ) : (
                          <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={12} />
                            {ecartNum > 0 ? `+${fcfa(ecartNum)}` : fcfa(ecartNum)}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {isOuverte && (
                          <button
                            type="button"
                            disabled={loadingAction === session.id}
                            onClick={() => handleForceCloture(session.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#b91c1c',
                              background: '#fef2f2',
                              border: '1px solid #fecaca',
                              padding: '4px 8px',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
                            <Lock size={12} />
                            <span>{loadingAction === session.id ? 'Fermeture...' : 'Forcer clôture'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
