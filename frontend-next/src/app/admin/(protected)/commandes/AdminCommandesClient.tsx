'use client'

import { useState, useTransition } from 'react'
import {
  ShoppingBag, Search, Filter, Clock, CheckCircle2, Truck, XCircle,
  Eye, RefreshCw, Phone, MapPin, Store, DollarSign
} from 'lucide-react'
import { fcfa } from '@/lib/format'

interface Commande {
  id: string
  reference: string
  boutique_id: string
  boutique_nom?: string
  boutique_slug?: string
  nom_produit: string
  quantite: number
  prix_unitaire: number
  montant_total: number
  client_nom: string
  client_telephone: string
  client_adresse?: string
  statut: string
  methode_paiement?: string
  source?: string
  notes?: string
  created_at: string
}

interface InitialData {
  commandes: Commande[]
  total: number
  page: number
  stats: {
    total: number
    en_attente: number
    confirmee: number
    expediee: number
    livree: number
    annulee: number
    volume_total: number
  }
}

export default function AdminCommandesClient({
  initialData,
  secret,
}: {
  initialData: InitialData
  secret: string
}) {
  const [commandes, setCommandes] = useState<Commande[]>(initialData?.commandes || [])
  const [total, setTotal] = useState(initialData?.total || 0)
  const [stats, setStats] = useState(initialData?.stats || { total: 0, en_attente: 0, confirmee: 0, expediee: 0, livree: 0, annulee: 0, volume_total: 0 })
  const [q, setQ] = useState('')
  const [statutFilter, setStatutFilter] = useState('tous')
  const [page, setPage] = useState(1)
  const [selectedCmd, setSelectedCmd] = useState<Commande | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const showToast = (type: 'ok' | 'err', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4000)
  }

  const fetchCommandes = (targetPage = 1, searchQuery = q, targetStatut = statutFilter) => {
    startTransition(async () => {
      try {
        const params = new URLSearchParams()
        params.set('page', String(targetPage))
        if (searchQuery.trim()) params.set('q', searchQuery.trim())
        if (targetStatut && targetStatut !== 'tous') params.set('statut', targetStatut)

        const res = await fetch(`/api/admin/commandes?${params.toString()}`, {
          headers: { 'X-Admin-Secret': secret },
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          setCommandes(data.commandes || [])
          setTotal(data.total || 0)
          setStats(data.stats || stats)
          setPage(targetPage)
        }
      } catch (err) {
        console.error('[FETCH_COMMANDES_ERR]', err)
      }
    })
  }

  const handleStatutChange = async (cmdId: string, newStatut: string) => {
    setLoadingId(cmdId)
    try {
      const res = await fetch(`/api/admin/commandes/${cmdId}/statut`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({ statut: newStatut }),
      })

      if (res.ok) {
        setCommandes(prev => prev.map(c => (c.id === cmdId ? { ...c, statut: newStatut } : c)))
        showToast('ok', `Statut de la commande mis à jour : "${newStatut}"`)
      } else {
        showToast('err', 'Erreur de mise à jour du statut.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur de connexion')
    } finally {
      setLoadingId(null)
    }
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_attente':
        return { bg: '#fef3c7', color: '#b45309', label: 'En attente' }
      case 'confirmee':
        return { bg: '#e0f2fe', color: '#0369a1', label: 'Confirmée' }
      case 'expediee':
        return { bg: '#f3e8ff', color: '#7e22ce', label: 'Expédiée' }
      case 'livree':
        return { bg: '#dcfce7', color: '#15803d', label: 'Livrée' }
      case 'annulee':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Annulée' }
      default:
        return { bg: '#f1f5f9', color: '#475569', label: statut }
    }
  }

  return (
    <div style={{ maxWidth: 1150, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            color: '#fff',
            backgroundColor: notification.type === 'ok' ? '#16a34a' : '#dc2626',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {notification.type === 'ok' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {notification.text}
        </div>
      )}

      {/* En-tête Page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="admin-page-titre" style={{ margin: 0 }}>
            🛍️ Commandes Centralisées
            <span className="admin-page-count">{total}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Supervision de l'ensemble des commandes passées sur les boutiques de la plateforme Nopalou.
          </p>
        </div>

        <button
          onClick={() => fetchCommandes(page, q, statutFilter)}
          disabled={isPending}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} className={isPending ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* 📊 Pilules KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Volume Total</span>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', marginTop: 2 }}>{fcfa(stats.volume_total || 0)}</div>
        </div>

        <div style={{ background: '#fff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>En attente</span>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#b45309', marginTop: 2 }}>{stats.en_attente || 0}</div>
        </div>

        <div style={{ background: '#fff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>Confirmées</span>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0369a1', marginTop: 2 }}>{stats.confirmee || 0}</div>
        </div>

        <div style={{ background: '#fff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#7e22ce', textTransform: 'uppercase' }}>Expédiées</span>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#7e22ce', marginTop: 2 }}>{stats.expediee || 0}</div>
        </div>

        <div style={{ background: '#fff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>Livrées</span>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#15803d', marginTop: 2 }}>{stats.livree || 0}</div>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Rechercher par référence, produit, client, téléphone ou boutique..."
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchCommandes(1, q, statutFilter) }}
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 14,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            value={statutFilter}
            onChange={e => {
              setStatutFilter(e.target.value)
              fetchCommandes(1, q, e.target.value)
            }}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              background: '#fff',
              color: '#334155',
            }}
          >
            <option value="tous">Tous les statuts</option>
            <option value="en_attente">⏳ En attente</option>
            <option value="confirmee">✔️ Confirmée</option>
            <option value="expediee">🚚 Expédiée</option>
            <option value="livree">📦 Livrée</option>
            <option value="annulee">❌ Annulée</option>
          </select>

          <button
            type="button"
            onClick={() => fetchCommandes(1, q, statutFilter)}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#1e293b',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Filtrer
          </button>
        </div>
      </div>

      {/* Tableau des Commandes */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
              <th style={{ padding: '12px 16px' }}>Réf. & Date</th>
              <th style={{ padding: '12px 16px' }}>Boutique</th>
              <th style={{ padding: '12px 16px' }}>Article & Total</th>
              <th style={{ padding: '12px 16px' }}>Client</th>
              <th style={{ padding: '12px 16px' }}>Statut</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Détails</th>
            </tr>
          </thead>
          <tbody>
            {commandes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                  Aucune commande trouvée.
                </td>
              </tr>
            ) : (
              commandes.map(cmd => {
                const badge = getStatutBadge(cmd.statut)
                const isBusy = loadingId === cmd.id

                return (
                  <tr key={cmd.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>{cmd.reference}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {new Date(cmd.created_at).toLocaleDateString('fr-FR')} {new Date(cmd.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{cmd.boutique_nom || 'Boutique'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{cmd.boutique_tel || ''}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{cmd.nom_produit} (x{cmd.quantite})</div>
                      <div style={{ fontWeight: 800, color: '#16a34a', fontSize: 13 }}>{fcfa(cmd.montant_total)}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{cmd.client_nom}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{cmd.client_telephone}</div>
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={cmd.statut}
                        disabled={isBusy}
                        onChange={e => handleStatutChange(cmd.id, e.target.value)}
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          padding: '4px 8px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="confirmee">Confirmée</option>
                        <option value="expediee">Expédiée</option>
                        <option value="livree">Livrée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedCmd(cmd)}
                        style={{
                          background: '#f1f5f9',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: '#334155',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Eye size={14} /> Voir
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Détails Commande */}
      {selectedCmd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              maxWidth: 520,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#0284c7', fontWeight: 700 }}>
                  {selectedCmd.reference}
                </span>
                <h2 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                  {selectedCmd.nom_produit}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCmd(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Boutique :</span>
                <span style={{ fontWeight: 700 }}>{selectedCmd.boutique_nom}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Quantité :</span>
                <span style={{ fontWeight: 700 }}>{selectedCmd.quantite}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Prix unitaire :</span>
                <span style={{ fontWeight: 700 }}>{fcfa(selectedCmd.prix_unitaire)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 6, fontSize: 15 }}>
                <span style={{ fontWeight: 800 }}>Montant Total :</span>
                <span style={{ fontWeight: 900, color: '#16a34a' }}>{fcfa(selectedCmd.montant_total)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                Coordonnées du Client
              </h3>
              <div style={{ fontSize: 13, color: '#334155', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div><strong>Nom :</strong> {selectedCmd.client_nom}</div>
                <div><strong>Téléphone :</strong> <a href={`tel:${selectedCmd.client_telephone}`} style={{ color: '#0284c7' }}>{selectedCmd.client_telephone}</a></div>
                {selectedCmd.client_adresse && <div><strong>Adresse :</strong> {selectedCmd.client_adresse}</div>}
                {selectedCmd.methode_paiement && <div><strong>Méthode de paiement :</strong> {selectedCmd.methode_paiement}</div>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedCmd(null)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#1e293b',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
