'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  CheckCircle2,
  Clock,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  ShieldCheck,
  User,
  Headphones,
} from 'lucide-react'

interface MessageTicket {
  id: string
  auteur: 'client' | 'support' | 'systeme'
  nom?: string
  message: string
  date: string
}

interface TicketDetail {
  id: string
  numero: string
  sujet: string
  description: string
  categorie: string
  statut: 'nouveau' | 'en_cours' | 'en_attente_client' | 'resolu' | 'ferme'
  priorite: string
  commande_ref?: string
  contact_nom?: string
  created_at: string
  updated_at: string
  messages?: MessageTicket[]
}

interface SuiviTicketSectionProps {
  initialNumero?: string
  onClose?: () => void
}

export default function SuiviTicketSection({
  initialNumero = '',
  onClose,
}: SuiviTicketSectionProps) {
  const [numero, setNumero] = useState(initialNumero)
  const [contact, setContact] = useState('')
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Réponse au ticket
  const [repMessage, setRepMessage] = useState('')
  const [sendingRep, setSendingRep] = useState(false)
  const [repSuccess, setRepSuccess] = useState(false)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  const fetchTicket = useCallback(async (numToFetch: string, contactArg?: string) => {
    const cleanNum = numToFetch.trim()
    if (!cleanNum) return

    setLoading(true)
    setError(null)

    try {
      const contactQuery = contactArg || contact
      const url = `${backendUrl}/api/support/tickets/suivi/${encodeURIComponent(cleanNum)}${contactQuery ? `?contact=${encodeURIComponent(contactQuery.trim())}` : ''}`
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ticket introuvable ou coordonnées de vérification requises.')
      }

      setTicket(data.ticket)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Impossible de récupérer ce ticket.'
      setError(msg)
      setTicket(null)
    } finally {
      setLoading(false)
    }
  }, [backendUrl, contact])

  useEffect(() => {
    if (initialNumero) {
      setNumero(initialNumero)
      fetchTicket(initialNumero)
    }
  }, [initialNumero, fetchTicket])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTicket(numero, contact)
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticket || !repMessage.trim()) return

    setSendingRep(true)
    setError(null)
    setRepSuccess(false)

    try {
      const res = await fetch(`${backendUrl}/api/support/tickets/${encodeURIComponent(ticket.numero)}/repondre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: repMessage.trim(),
          contact: contact.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible d'envoyer votre réponse.")
      }

      setRepMessage('')
      setRepSuccess(true)
      // Rafraîchir les messages du ticket
      fetchTicket(ticket.numero, contact)
      setTimeout(() => setRepSuccess(false), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi de la réponse."
      setError(msg)
    } finally {
      setSendingRep(false)
    }
  }

  const getBadgeStatut = (statut: string) => {
    switch (statut) {
      case 'resolu':
        return { label: 'Résolu', bg: 'rgba(10, 92, 54, 0.1)', color: '#0A5C36', icon: CheckCircle2 }
      case 'ferme':
        return { label: 'Clôturé', bg: 'rgba(100, 116, 139, 0.1)', color: '#475569', icon: Clock }
      case 'en_cours':
        return { label: 'En cours de traitement', bg: 'rgba(199, 91, 0, 0.1)', color: '#C75B00', icon: Clock }
      case 'en_attente_client':
        return { label: 'En attente de votre réponse', bg: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', icon: MessageSquare }
      default:
        return { label: 'Nouveau / Reçu', bg: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', icon: Clock }
    }
  }

  return (
    <div
      style={{
        background: 'var(--card, #ffffff)',
        borderRadius: '16px',
        border: '1.5px solid var(--border, #E8DDD2)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '32px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={20} color="var(--accent, #C75B00)" />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
            Suivi & Historique de Ticket SAV
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn-npl btn-npl-secondary"
            style={{ padding: '4px 10px', fontSize: '12px' }}
          >
            Masquer
          </button>
        )}
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text2, #555)', margin: '0 0 16px', lineHeight: 1.4 }}>
        Consultez l&apos;état d&apos;avancement de votre dossier et échangez directement avec les conseillers du support technique.
      </p>

      {/* Formulaire de recherche de ticket */}
      <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr auto', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={numero}
          onChange={e => setNumero(e.target.value)}
          placeholder="Numéro de ticket (ex: TCK-2026-XXXX)"
          required
          className="input-npl"
          style={{ height: '42px', fontSize: '13.5px' }}
        />

        <input
          type="text"
          value={contact}
          onChange={e => setContact(e.target.value)}
          placeholder="Téléphone ou email de vérification"
          className="input-npl"
          style={{ height: '42px', fontSize: '13.5px' }}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-npl btn-npl-primary"
          style={{ height: '42px', padding: '0 18px', whiteSpace: 'nowrap' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          <span>{loading ? 'Recherche...' : 'Consulter'}</span>
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: '10px',
            color: '#dc2626',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Détail du ticket chargé */}
      {ticket && (
        <div style={{ borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: '20px' }}>
          {/* Header Ticket */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', background: 'var(--bg, #F8F5F0)', padding: '2px 8px', borderRadius: '6px' }}>
                  {ticket.numero}
                </span>
                {ticket.commande_ref && (
                  <span style={{ fontSize: '12px', color: 'var(--text3, #888)' }}>
                    Réf. Commande : <strong>{ticket.commande_ref}</strong>
                  </span>
                )}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
                {ticket.sujet}
              </h3>
            </div>

            {(() => {
              const badge = getBadgeStatut(ticket.statut)
              const IconComp = badge.icon
              return (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: badge.bg,
                    color: badge.color,
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <IconComp size={14} />
                  <span>{badge.label}</span>
                </div>
              )
            })()}
          </div>

          {/* Description initiale */}
          <div
            style={{
              background: 'var(--bg, #F8F5F0)',
              borderRadius: '12px',
              padding: '14px 16px',
              fontSize: '13.5px',
              color: 'var(--text2, #555)',
              lineHeight: 1.5,
              marginBottom: '20px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3, #888)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Description initiale
            </div>
            {ticket.description}
          </div>

          {/* Fil de discussion */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 4px' }}>
              Historique des échanges
            </h4>

            {ticket.messages && ticket.messages.length > 0 ? (
              ticket.messages.map((msg, i) => {
                const isSupport = msg.auteur === 'support' || msg.auteur === 'systeme'
                return (
                  <div
                    key={msg.id || i}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'flex-start',
                      alignSelf: isSupport ? 'flex-start' : 'flex-end',
                      maxWidth: '85%',
                    }}
                  >
                    {isSupport && (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'rgba(199, 91, 0, 0.12)',
                          color: 'var(--accent, #C75B00)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Headphones size={16} />
                      </div>
                    )}

                    <div
                      style={{
                        background: isSupport ? '#ffffff' : 'var(--navy, #1C2B4A)',
                        color: isSupport ? 'var(--navy, #1C2B4A)' : '#ffffff',
                        border: isSupport ? '1px solid var(--border, #E8DDD2)' : 'none',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        fontSize: '13px',
                        lineHeight: 1.5,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          fontSize: '11px',
                          opacity: 0.75,
                          marginBottom: '4px',
                          fontWeight: 700,
                        }}
                      >
                        <span>{isSupport ? 'Support Nopalou' : (msg.nom || 'Vous')}</span>
                        {msg.date && (
                          <span>
                            {new Date(msg.date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.message}</div>
                    </div>

                    {!isSupport && (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--navy, #1C2B4A)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <User size={16} />
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--text3, #888)', fontStyle: 'italic' }}>
                Aucune réponse pour le moment. Votre dossier est en attente d&apos;attribution.
              </div>
            )}
          </div>

          {/* Formulaire de réponse client */}
          {ticket.statut !== 'ferme' ? (
            <form onSubmit={handleSendReply} style={{ borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: '16px' }}>
              {repSuccess && (
                <div style={{ fontSize: '13px', color: 'var(--price, #0A5C36)', fontWeight: 700, marginBottom: '8px' }}>
                  Votre message a bien été transmis au conseiller support.
                </div>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={repMessage}
                  onChange={e => setRepMessage(e.target.value)}
                  placeholder="Écrire une réponse ou un complément d'information..."
                  required
                  className="input-npl"
                  style={{ flex: 1, height: '42px', fontSize: '13.5px' }}
                />
                <button
                  type="submit"
                  disabled={sendingRep}
                  className="btn-npl btn-npl-primary"
                  style={{ padding: '0 18px', height: '42px', whiteSpace: 'nowrap' }}
                >
                  {sendingRep ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Répondre</span>
                </button>
              </div>
            </form>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text3, #888)', textAlign: 'center', padding: '10px' }}>
              Ce ticket est clôturé. Si le problème persiste, veuillez ouvrir un nouveau ticket.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
