'use client'

import { useState } from 'react'
import {
  CreditCard,
  AlertCircle,
  TrendingDown,
  Phone,
  Store,
  Sliders,
  Search,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import { adminAjusterCreditClient } from '@/app/actions/admin'
import { showToast } from '@/context/ToastContext'

interface CarnetDettesClientProps {
  initialStats: any
  initialClients: any[]
}

export default function CarnetDettesClient({ initialStats, initialClients }: CarnetDettesClientProps) {
  const [clients, setClients] = useState(initialClients)
  const [search, setSearch] = useState('')
  const [editingClient, setEditingClient] = useState<any | null>(null)
  const [newLimit, setNewLimit] = useState<number>(0)
  const [saving, setSaving] = useState(false)

  const handleOpenEdit = (client: any) => {
    setEditingClient(client)
    setNewLimit(Number(client.limite_credit) || 0)
  }

  const handleSaveLimit = async () => {
    if (!editingClient) return
    setSaving(true)
    try {
      const res = await adminAjusterCreditClient(editingClient.id, { limite_credit: newLimit })
      if (res.success) {
        setClients((prev) =>
          prev.map((c) => (c.id === editingClient.id ? { ...c, limite_credit: newLimit } : c))
        )
        setEditingClient(null)
        showToast('Plafond de crédit mis à jour avec succès.', 'success', 'Carnet Dettes')
      } else {
        showToast(res.error || 'Erreur lors de la mise à jour', 'error', 'Carnet Dettes')
      }
    } finally {
      setSaving(false)
    }
  }

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.nom?.toLowerCase().includes(q) ||
      c.telephone?.toLowerCase().includes(q) ||
      c.boutique_nom?.toLowerCase().includes(q)
    )
  })

  const stats = initialStats || {}
  const retards = stats.retards || {}
  const plans = stats.plans || {}

  return (
    <div className="admin-page-container">
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
            Carnet de Dettes & Crédits Clients
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>
            Supervision du risque d&apos;impayés, encours de créances commerçants et plafonds de crédit.
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
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Encours Total Dettes</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '8px 0 4px' }}>
            {fcfa(stats.encoursTotal || 0)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Réparti sur {stats.nbClientsEndettes || 0} clients actifs
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Échéances en Retard</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: retards.nbEcheances > 0 ? '#ef4444' : 'var(--navy)', margin: '8px 0 4px' }}>
            {retards.nbEcheances || 0}
          </div>
          <div style={{ fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertCircle size={13} />
            <span>{fcfa(retards.montantTotal || 0)} en souffrance</span>
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Plans d&apos;Échelonnement</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0284c7', margin: '8px 0 4px' }}>
            {plans.actifs || 0} en cours
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            {plans.soldes || 0} plans entièrement soldés
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ffffff', padding: 18, borderRadius: 10, border: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Boutiques Créancières</span>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', margin: '8px 0 4px' }}>
            {stats.nbBoutiquesCrediteurs || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Proposant la vente à crédit
          </div>
        </div>
      </div>

      {/* Barre de Recherche */}
      <div style={{ background: '#ffffff', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ position: 'relative', minWidth: 280, flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input
            type="text"
            placeholder="Rechercher par nom client, téléphone, boutique..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 32px',
              fontSize: 13,
              borderRadius: 6,
              border: '1px solid var(--border)',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Tableau des Créances */}
      <div style={{ background: '#ffffff', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <th style={{ padding: '12px 16px' }}>Client & Contact</th>
                <th style={{ padding: '12px 16px' }}>Boutique Créancière</th>
                <th style={{ padding: '12px 16px' }}>Solde Dû (Encours)</th>
                <th style={{ padding: '12px 16px' }}>Plafond Crédit</th>
                <th style={{ padding: '12px 16px' }}>Ratio Utilisation</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text3)' }}>
                    Aucun client débiteur enregistré ou correspondant à la recherche.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const solde = Number(c.solde) || 0
                  const limite = Number(c.limite_credit) || 0
                  const ratio = limite > 0 ? Math.min(100, Math.round((solde / limite) * 100)) : 100

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{c.nom}</div>
                        {c.telephone && (
                          <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Phone size={11} />
                            <span>{c.telephone}</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, color: 'var(--text1)' }}>{c.boutique_nom}</div>
                        {c.boutique_tel && (
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.boutique_tel}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#ef4444' }}>
                        {fcfa(solde)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--text2)' }}>
                        {limite > 0 ? fcfa(limite) : 'Illimité / Non défini'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, maxWidth: 80, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${ratio}%`,
                                height: '100%',
                                background: ratio >= 90 ? '#ef4444' : ratio >= 70 ? '#f59e0b' : '#10b981',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: ratio >= 90 ? '#ef4444' : 'var(--text2)' }}>
                            {ratio}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            color: 'var(--navy)',
                            background: '#f8fafc',
                            border: '1px solid var(--border)',
                            padding: '4px 10px',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          <Sliders size={12} />
                          <span>Ajuster</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale d'ajustement du plafond */}
      {editingClient && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div style={{ background: '#ffffff', borderRadius: 12, maxWidth: 400, width: '100%', padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: '0 0 12px' }}>
              Ajuster le plafond de crédit
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: '0 0 16px' }}>
              Client : <strong>{editingClient.nom}</strong> ({editingClient.boutique_nom})
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                Nouveau plafond autorisé (FCFA)
              </label>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  fontSize: 14,
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'none',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveLimit}
                className="btn-npl"
                style={{ padding: '8px 14px', fontSize: 13 }}
              >
                {saving ? 'Enregistrement...' : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
