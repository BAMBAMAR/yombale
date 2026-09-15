'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Wrench,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Home,
  User,
  DollarSign,
  Filter,
  Check
} from 'lucide-react'

interface TicketItem {
  id: string
  bien_id: string
  bien_titre: string
  bien_quartier?: string
  bien_ville?: string
  type: string
  description: string
  priorite: string
  statut: string
  demandeur: string
  technicien?: string
  cout_estime?: number
  cout_reel?: number
  a_charge_de: string
  date_signal: string
  date_resolution?: string
}

interface BienOption {
  id: string
  titre: string
  quartier?: string
  ville: string
}

export default function AgenceMaintenancePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [biens, setBiens] = useState<BienOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    bien_id: '',
    type: 'plomberie',
    description: '',
    priorite: 'normale',
    demandeur: 'locataire',
    technicien: '',
    cout_estime: '',
    a_charge_de: 'proprietaire',
  })

  async function chargerDonnees() {
    try {
      setLoading(true)
      const [resTickets, resBiens] = await Promise.all([
        fetch(`/api/locatif-immo/agence/${slug}/maintenance`),
        fetch(`/api/biens/agence/${slug}?statut=actif`),
      ])
      const dataT = await resTickets.json()
      const dataB = await resBiens.json()

      if (dataT.success) setTickets(dataT.tickets || [])
      if (dataB.success && dataB.biens) {
        setBiens(dataB.biens)
        if (dataB.biens.length > 0 && !form.bien_id) {
          setForm(prev => ({ ...prev, bien_id: dataB.biens[0].id }))
        }
      }
    } catch (err) {
      console.error('[LOAD_MAINTENANCE_ERR]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) chargerDonnees()
  }, [slug])

  async function handleCreerTicket(e: React.FormEvent) {
    e.preventDefault()
    if (!form.bien_id || !form.description.trim()) return

    try {
      setSaving(true)
      const res = await fetch(`/api/locatif-immo/agence/${slug}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setToastMsg('Incident / Travail enregistré avec succès.')
        setShowModal(false)
        setForm({
          bien_id: biens[0]?.id || '',
          type: 'plomberie',
          description: '',
          priorite: 'normale',
          demandeur: 'locataire',
          technicien: '',
          cout_estime: '',
          a_charge_de: 'proprietaire',
        })
        chargerDonnees()
        setTimeout(() => setToastMsg(null), 4000)
      }
    } catch (err) {
      console.error('[CREATE_TICKET_ERR]', err)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangerStatut(ticketId: string, nouveauStatut: string) {
    try {
      const res = await fetch(`/api/locatif-immo/agence/${slug}/maintenance/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: nouveauStatut }),
      })
      const data = await res.json()
      if (data.success) {
        setTickets(prev =>
          prev.map(t => (t.id === ticketId ? { ...t, statut: nouveauStatut } : t))
        )
      }
    } catch (err) {
      console.error('[UPDATE_TICKET_STATUS_ERR]', err)
    }
  }

  const ticketsFiltres = tickets.filter(t => {
    if (filtreStatut === 'tous') return true
    return t.statut === filtreStatut
  })

  return (
    <div>
      {/* ── En-tête ── */}
      <div className="agence-header">
        <div>
          <h1 className="agence-title">Maintenance & Travaux</h1>
          <p className="agence-subtitle">Gestion des incidents locatifs, réparations, artisans et imputations de coûts.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 8,
            background: 'var(--accent, #C75B00)',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Plus size={18} />
          Signaler un incident
        </button>
      </div>

      {toastMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#DCFCE7',
            color: '#166534',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <CheckCircle2 size={18} />
          {toastMsg}
        </div>
      )}

      {/* ── Filtres de statut ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'tous', label: 'Tous les tickets' },
          { id: 'signale', label: 'Signalés' },
          { id: 'en_cours', label: 'En cours d’intervention' },
          { id: 'resolu', label: 'Résolus' },
        ].map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltreStatut(f.id)}
            style={{
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: filtreStatut === f.id ? 'var(--navy, #1C2B4A)' : 'var(--border, #E8DDD2)',
              background: filtreStatut === f.id ? 'var(--navy, #1C2B4A)' : '#FFFFFF',
              color: filtreStatut === f.id ? '#FFFFFF' : 'var(--navy, #1C2B4A)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Liste des Tickets ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
          <p>Chargement des incidents...</p>
        </div>
      ) : ticketsFiltres.length === 0 ? (
        <div className="agence-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
          <Wrench size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ fontWeight: 700, color: 'var(--navy, #1C2B4A)', fontSize: 16 }}>Aucun incident à signaler</p>
          <p style={{ fontSize: 13.5 }}>Tous vos biens sous gestion sont actuellement en parfait état.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {ticketsFiltres.map(ticket => (
            <div key={ticket.id} className="agence-card" style={{ padding: 18, marginBottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: ticket.priorite === 'urgente' ? '#FEE2E2' : '#F1F5F9',
                      color: ticket.priorite === 'urgente' ? '#991B1B' : '#475569',
                    }}
                  >
                    {ticket.type} • {ticket.priorite}
                  </span>

                  <span className={`status-badge ${ticket.statut === 'resolu' ? 'actif' : 'pause'}`}>
                    {ticket.statut === 'resolu' ? 'Résolu' : ticket.statut === 'en_cours' ? 'En cours' : 'Signalé'}
                  </span>
                </div>

                <div style={{ fontWeight: 800, color: 'var(--navy, #1C2B4A)', fontSize: 14.5, marginBottom: 4 }}>
                  {ticket.bien_titre}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
                  {ticket.bien_quartier ? `${ticket.bien_quartier}, ${ticket.bien_ville}` : ticket.bien_ville}
                </div>

                <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>
                  {ticket.description}
                </p>

                <div style={{ fontSize: 12, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 4, padding: '10px', background: '#FAF8F5', borderRadius: 6, marginBottom: 14 }}>
                  <div><strong>Demandeur :</strong> {ticket.demandeur}</div>
                  <div><strong>Prise en charge :</strong> {ticket.a_charge_de === 'proprietaire' ? 'Bailleur' : 'Locataire'}</div>
                  {ticket.cout_estime && <div><strong>Coût estimé :</strong> {Number(ticket.cout_estime).toLocaleString('fr-FR')} FCFA</div>}
                  {ticket.technicien && <div><strong>Artisan / Prestataire :</strong> {ticket.technicien}</div>}
                </div>
              </div>

              {/* Actions de Statut */}
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 12 }}>
                {ticket.statut !== 'en_cours' && ticket.statut !== 'resolu' && (
                  <button
                    type="button"
                    onClick={() => handleChangerStatut(ticket.id, 'en_cours')}
                    style={{
                      flex: 1,
                      padding: '7px',
                      borderRadius: 6,
                      background: '#FAF8F5',
                      border: '1px solid var(--border, #E8DDD2)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Démarrer travaux
                  </button>
                )}
                {ticket.statut !== 'resolu' && (
                  <button
                    type="button"
                    onClick={() => handleChangerStatut(ticket.id, 'resolu')}
                    style={{
                      flex: 1,
                      padding: '7px',
                      borderRadius: 6,
                      background: '#16a34a',
                      color: '#FFFFFF',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <Check size={14} />
                    Marquer résolu
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modale Nouveau Ticket ── */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 43, 74, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              maxWidth: 520,
              width: '100%',
              padding: 24,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Wrench size={20} color="var(--accent, #C75B00)" />
                <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                  Signaler un incident / Travaux
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: '#94A3B8', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreerTicket}>
              <div className="form-group">
                <label className="form-label">Bien concerné *</label>
                <select
                  required
                  value={form.bien_id}
                  onChange={e => setForm({ ...form, bien_id: e.target.value })}
                  className="form-select"
                >
                  {biens.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.titre} ({b.quartier ? `${b.quartier}, ${b.ville}` : b.ville})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Type d'incident</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="form-select"
                  >
                    <option value="plomberie">Plomberie & Fuites</option>
                    <option value="electricite">Électricité & Disjoncteur</option>
                    <option value="climatisation">Climatisation</option>
                    <option value="peinture">Peinture & Murs</option>
                    <option value="serrurerie">Serrurerie & Portes</option>
                    <option value="autre">Autre incident</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priorité</label>
                  <select
                    value={form.priorite}
                    onChange={e => setForm({ ...form, priorite: e.target.value })}
                    className="form-select"
                  >
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description du problème *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Fuite d'eau sous l'évier de la cuisine nécessitant le remplacement d'un joint..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Prise en charge</label>
                  <select
                    value={form.a_charge_de}
                    onChange={e => setForm({ ...form, a_charge_de: e.target.value })}
                    className="form-select"
                  >
                    <option value="proprietaire">Propriétaire (Bailleur)</option>
                    <option value="locataire">Locataire (Entretien courant)</option>
                    <option value="agence">Agence (Garantie)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Coût estimé (FCFA)</label>
                  <input
                    type="number"
                    placeholder="25000"
                    value={form.cout_estime}
                    onChange={e => setForm({ ...form, cout_estime: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Prestataire / Artisan assigné (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Babacar Plombier (+221 77 ...)"
                  value={form.technicien}
                  onChange={e => setForm({ ...form, technicien: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 8,
                    background: '#FAF8F5',
                    border: '1px solid var(--border, #E8DDD2)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 8,
                    background: 'var(--accent, #C75B00)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer le ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
