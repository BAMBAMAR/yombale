'use client'

import React, { useState } from 'react'
import {
  X,
  HelpCircle,
  Send,
  Loader2,
  CheckCircle2,
  Copy,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'

interface ModalCreerTicketProps {
  isOpen: boolean
  onClose: () => void
  onTicketCree?: (numero: string) => void
}

const CATEGORIES = [
  { id: 'technique', label: 'Problème technique / Bug' },
  { id: 'caisse', label: 'Caisse POS & Vente' },
  { id: 'paiement', label: 'Paiement & Facturation (Wave, OM, Carte)' },
  { id: 'boutique', label: 'Gestion boutique & Catalogue' },
  { id: 'commande', label: 'Commande & Livraison' },
  { id: 'compte', label: 'Compte & Connexion' },
  { id: 'autre', label: 'Autre demande' },
]

export default function ModalCreerTicket({
  isOpen,
  onClose,
  onTicketCree,
}: ModalCreerTicketProps) {
  const [categorie, setCategorie] = useState('technique')
  const [sujet, setSujet] = useState('')
  const [description, setDescription] = useState('')
  const [priorite, setPriorite] = useState('normale')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [email, setEmail] = useState('')
  const [commandeRef, setCommandeRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketResult, setTicketResult] = useState<{ numero: string } | null>(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleCopy = () => {
    if (ticketResult?.numero) {
      navigator.clipboard.writeText(ticketResult.numero)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!sujet.trim() || sujet.trim().length < 5) {
      setError('Veuillez indiquer un sujet clair (au moins 5 caractères).')
      return
    }

    if (!description.trim() || description.trim().length < 15) {
      setError('Veuillez décrire votre problème en détail (au moins 15 caractères).')
      return
    }

    if (!telephone.trim()) {
      setError('Veuillez indiquer un numéro de téléphone pour vous contacter.')
      return
    }

    setSubmitting(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

    try {
      const res = await fetch(`${backendUrl}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sujet: sujet.trim(),
          description: description.trim(),
          categorie,
          priorite,
          commande_ref: commandeRef.trim() || undefined,
          contact_nom: nom.trim() || undefined,
          contact_telephone: telephone.trim(),
          contact_email: email.trim() || undefined,
          canal: 'web_aide',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible d'enregistrer le ticket.")
      }

      setTicketResult(data.ticket)
      if (onTicketCree) {
        onTicketCree(data.ticket.numero)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue lors de la soumission.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setTicketResult(null)
    setSujet('')
    setDescription('')
    setCommandeRef('')
    setError(null)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: 'var(--card, #ffffff)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid var(--border, #E8DDD2)',
          position: 'relative',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(199, 91, 0, 0.1)',
                color: 'var(--accent, #C75B00)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Ouvrir un ticket d&apos;assistance
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text3, #888)' }}>
                Notre équipe technique et support traite votre dossier
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text3, #888)',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {ticketResult ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(10, 92, 54, 0.1)',
                color: 'var(--price, #0A5C36)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px' }}>
              Ticket d&apos;assistance créé
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text2, #555)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Votre demande a été enregistrée avec succès. Vous recevrez une notification par message ou WhatsApp dès qu&apos;un conseiller répond.
            </p>

            <div
              style={{
                background: 'var(--bg, #F8F5F0)',
                border: '1px dashed var(--border, #E8DDD2)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '11px', color: 'var(--text3, #888)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Référence du Ticket
                </span>
                <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                  {ticketResult.numero}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="btn-npl btn-npl-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`https://wa.me/221708717942?text=${encodeURIComponent(`Bonjour Nopalou, j'ai ouvert le ticket d'assistance ${ticketResult.numero}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-npl btn-npl-primary"
                style={{ textDecoration: 'none', justifyContent: 'center' }}
              >
                <ExternalLink size={16} />
                <span>Consulter / Compléter sur WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="btn-npl btn-npl-secondary"
                style={{ justifyContent: 'center' }}
              >
                Terminer
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  background: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                  borderRadius: '10px',
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '5px' }}>
                  Catégorie du problème *
                </label>
                <select
                  value={categorie}
                  onChange={e => setCategorie(e.target.value)}
                  className="input-npl"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '5px' }}>
                  Urgence / Priorité
                </label>
                <select
                  value={priorite}
                  onChange={e => setPriorite(e.target.value)}
                  className="input-npl"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                >
                  <option value="normale">Normale</option>
                  <option value="haute">Haute (Bloquant)</option>
                  <option value="urgente">Urgente (Panne critique)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '5px' }}>
                Sujet de votre demande *
              </label>
              <input
                type="text"
                value={sujet}
                onChange={e => setSujet(e.target.value)}
                placeholder="Ex: Erreur lors de l'export comptable SYSCOHADA"
                required
                className="input-npl"
                style={{ width: '100%', height: '40px', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '5px' }}>
                Description détaillée *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décrivez précisément ce qui s'est passé, les messages d'erreur rencontrés, les étapes pour reproduire..."
                rows={4}
                required
                className="input-npl"
                style={{ width: '100%', resize: 'vertical', fontSize: '13px', padding: '10px 12px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '5px' }}>
                  Votre nom
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Mamadou Diop"
                  className="input-npl"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '5px' }}>
                  Téléphone WhatsApp *
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  placeholder="77 123 45 67"
                  required
                  className="input-npl"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '5px' }}>
                  Email de notification
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  className="input-npl"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '5px' }}>
                  Réf. Commande (optionnel)
                </label>
                <input
                  type="text"
                  value={commandeRef}
                  onChange={e => setCommandeRef(e.target.value)}
                  placeholder="CMD-XXXX"
                  className="input-npl"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="btn-npl btn-npl-secondary"
                style={{ flex: '1', justifyContent: 'center' }}
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="btn-npl btn-npl-primary"
                style={{ flex: '2', justifyContent: 'center' }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Création du ticket...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Ouvrir le ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
