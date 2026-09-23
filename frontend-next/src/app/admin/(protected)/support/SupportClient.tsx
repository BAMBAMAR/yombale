'use client'

import React, { useState } from 'react'
import {
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  User,
  Store,
  ShoppingBag,
  X,
  Search,
} from 'lucide-react'

interface Ticket {
  id: string
  numero_ticket: string
  sujet: string
  categorie: string
  priorite: string
  statut: string
  created_at: string
  updated_at: string
  utilisateur_nom: string | null
  utilisateur_email: string | null
  utilisateur_tel: string | null
  boutique_nom: string | null
  commande_ref: string | null
  assigne_nom: string | null
}

interface SupportClientProps {
  initialTickets: Ticket[]
  total: number
  token: string
}

export default function SupportClient({ initialTickets, total, token }: SupportClientProps) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [filterStatut, setFilterStatut] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const openTicketDetail = async (ticketId: string) => {
    setLoadingDetail(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedTicket(data.ticket)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyText.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedTicket(data.ticket)
        setReplyText('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSendingReply(false)
    }
  }

  const handleUpdateStatut = async (newStatut: string) => {
    if (!selectedTicket) return
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicket.id}/statut`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ statut: newStatut }),
      })
      if (res.ok) {
        const data = await res.json()
        setSelectedTicket(data.ticket)
        setTickets(prev => prev.map(t => t.id === data.ticket.id ? { ...t, statut: newStatut } : t))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredTickets = tickets.filter(t => {
    if (filterStatut && t.statut !== filterStatut) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      const matchSujet = t.sujet.toLowerCase().includes(term)
      const matchNum = t.numero_ticket.toLowerCase().includes(term)
      const matchNom = (t.utilisateur_nom || '').toLowerCase().includes(term)
      if (!matchSujet && !matchNum && !matchNom) return false
    }
    return true
  })

  return (
    <div style={{ padding: '0 8px 32px' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text1, #1e293b)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <LifeBuoy size={22} color="var(--accent, #0284c7)" />
            Helpdesk &amp; Support Client
          </h1>
          <p style={{ color: 'var(--text3, #64748b)', marginTop: 4, fontSize: 14 }}>
            Centralisation des réclamations clients, litiges marchands et demandes d&apos;assistance ({total} ticket(s)).
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {['', 'ouvert', 'en_cours', 'en_attente_client', 'resolu', 'ferme'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilterStatut(st)}
            className={`btn-npl ${filterStatut === st ? 'btn-npl--primary' : 'btn-npl--secondary'}`}
            style={{ fontSize: 13, padding: '6px 14px' }}
          >
            {st === '' ? 'Tous les tickets' : st.replace('_', ' ')}
          </button>
        ))}

        <div style={{ position: 'relative', marginLeft: 'auto', minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Rechercher par sujet, n°, client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium"
            style={{ width: '100%', paddingLeft: 32, fontSize: 13 }}
          />
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, overflow: 'hidden' }}>
        {filteredTickets.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Aucun ticket ne correspond aux critères.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>N° Ticket</th>
                <th style={{ padding: '12px 16px' }}>Sujet &amp; Catégorie</th>
                <th style={{ padding: '12px 16px' }}>Demandeur</th>
                <th style={{ padding: '12px 16px' }}>Priorité</th>
                <th style={{ padding: '12px 16px' }}>Statut</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text1, #0f172a)' }}>
                    {t.numero_ticket}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{t.sujet}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Catégorie : {t.categorie}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{t.utilisateur_nom || 'Anonyme'}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{t.utilisateur_tel || t.utilisateur_email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: t.priorite === 'urgente' ? '#fef2f2' : t.priorite === 'haute' ? '#fff7ed' : '#f0fdf4',
                      color: t.priorite === 'urgente' ? '#dc2626' : t.priorite === 'haute' ? '#ea580c' : '#16a34a',
                    }}>
                      {t.priorite}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: t.statut === 'ouvert' ? '#eff6ff' : t.statut === 'resolu' ? '#f0fdf4' : '#f8fafc',
                      color: t.statut === 'ouvert' ? '#2563eb' : t.statut === 'resolu' ? '#16a34a' : '#475569',
                    }}>
                      {t.statut.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => openTicketDetail(t.id)}
                      className="btn-npl btn-npl--secondary"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      Ouvrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer / Modale de détail du ticket */}
      {selectedTicket && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <div style={{
            background: '#fff',
            width: '100%',
            maxWidth: 580,
            height: '100%',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header Drawer */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent, #0284c7)' }}>{selectedTicket.numero_ticket}</span>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: '2px 0 0', color: '#0f172a' }}>{selectedTicket.sujet}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Corps du ticket */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 6 }}>
                  <div><strong>Demandeur :</strong> {selectedTicket.utilisateur_nom || 'Client'}</div>
                  {selectedTicket.utilisateur_tel && <div><strong>Tél :</strong> {selectedTicket.utilisateur_tel}</div>}
                  {selectedTicket.commande_ref && <div><strong>Commande :</strong> {selectedTicket.commande_ref}</div>}
                  {selectedTicket.boutique_nom && <div><strong>Boutique :</strong> {selectedTicket.boutique_nom}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Changer statut :</span>
                  {['ouvert', 'en_cours', 'en_attente_client', 'resolu', 'ferme'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleUpdateStatut(st)}
                      style={{
                        fontSize: 11,
                        padding: '3px 8px',
                        borderRadius: 4,
                        border: selectedTicket.statut === st ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: selectedTicket.statut === st ? '#e0f2fe' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fil des messages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: '#334155' }}>Historique des échanges</h3>
                {(selectedTicket.messages || []).length === 0 ? (
                  <p style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Aucun échange enregistré pour le moment.</p>
                ) : (
                  (selectedTicket.messages || []).map((m: any, idx: number) => {
                    const isAdmin = m.role === 'admin'
                    return (
                      <div
                        key={idx}
                        style={{
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          background: isAdmin ? 'var(--navy, #1e293b)' : '#f1f5f9',
                          color: isAdmin ? '#fff' : '#0f172a',
                          padding: '10px 14px',
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4, fontWeight: 600 }}>
                          {m.auteur} · {new Date(m.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{m.texte}</div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Formulaire de réponse */}
            <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', background: '#fff' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea
                  rows={2}
                  placeholder="Rédiger une réponse au client/marchand..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="input-premium"
                  style={{ flex: 1, resize: 'none', fontSize: 13 }}
                />
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="btn-npl btn-npl--primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-end' }}
                >
                  <Send size={14} />
                  <span>Envoyer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
