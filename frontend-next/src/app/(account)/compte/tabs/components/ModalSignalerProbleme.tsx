'use client'

import React, { useState } from 'react'
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Send,
  Loader2,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'

interface CommandeRef {
  id: string
  reference: string
  client_nom: string
  client_telephone: string
  boutique_id?: string
  boutique_nom: string
}

interface ModalSignalerProblemeProps {
  isOpen: boolean
  onClose: () => void
  commande: CommandeRef | null
}

const MOTIFS = [
  { id: 'produit_non_recu', label: 'Colis non reçu / retard critique', priorite: 'haute' },
  { id: 'produit_endommage', label: 'Produit endommagé ou détérioré', priorite: 'haute' },
  { id: 'produit_non_conforme', label: 'Article non conforme (taille, couleur, modèle)', priorite: 'normale' },
  { id: 'probleme_paiement', label: 'Incident de paiement / Débit Wave ou OM non crédité', priorite: 'urgente' },
  { id: 'contact_vendeur', label: 'Vendeur injoignable après validation', priorite: 'normale' },
  { id: 'autre', label: 'Autre motif ou réclamation', priorite: 'normale' },
]

export default function ModalSignalerProbleme({
  isOpen,
  onClose,
  commande,
}: ModalSignalerProblemeProps) {
  const [motif, setMotif] = useState(MOTIFS[0].id)
  const [description, setDescription] = useState('')
  const [nom, setNom] = useState(commande?.client_nom || '')
  const [telephone, setTelephone] = useState(commande?.client_telephone || '')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketCree, setTicketCree] = useState<{ numero: string; code_suivi?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Synchroniser les coordonnées à l'ouverture si besoin
  React.useEffect(() => {
    if (commande) {
      if (!nom) setNom(commande.client_nom || '')
      if (!telephone) setTelephone(commande.client_telephone || '')
    }
  }, [commande])

  if (!isOpen || !commande) return null

  const handleCopyNumero = () => {
    if (ticketCree?.numero) {
      navigator.clipboard.writeText(ticketCree.numero)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!description.trim() || description.trim().length < 10) {
      setError('Veuillez décrire le problème de manière plus détaillée (au moins 10 caractères).')
      return
    }

    if (!telephone.trim()) {
      setError('Veuillez renseigner un numéro de téléphone pour le suivi de votre dossier.')
      return
    }

    const selectedMotif = MOTIFS.find(m => m.id === motif)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

    setSubmitting(true)
    try {
      const res = await fetch(`${backendUrl}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sujet: `Litige Commande #${commande.reference} - ${selectedMotif?.label || motif}`,
          description: description.trim(),
          categorie: 'commande',
          priorite: selectedMotif?.priorite || 'normale',
          commande_ref: commande.reference,
          boutique_id: commande.boutique_id || undefined,
          contact_nom: nom.trim() || commande.client_nom,
          contact_telephone: telephone.trim(),
          contact_email: email.trim() || undefined,
          canal: 'web_suivi',
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Impossible d'enregistrer le signalement.")
      }

      setTicketCree(data.ticket)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Une erreur est survenue lors de la transmission.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetAndClose = () => {
    setTicketCree(null)
    setDescription('')
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
          maxWidth: '520px',
          maxHeight: '90vh',
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
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                Signaler un problème
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text3, #888)' }}>
                Commande #{commande.reference} &bull; {commande.boutique_nom}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
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

        {ticketCree ? (
          /* Confirmation écran */
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
              <ShieldCheck size={32} />
            </div>

            <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--navy, #1C2B4A)', margin: '0 0 8px' }}>
              Dossier SAV ouvert avec succès
            </h4>
            <p style={{ fontSize: '13.5px', color: 'var(--text2, #555)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Votre réclamation a été transmise à l&apos;équipe d&apos;assistance Nopalou ainsi qu&apos;au vendeur.
              Un chargé de dossier prend en charge votre demande.
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
                  Numéro de ticket SAV
                </span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
                  {ticketCree.numero}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyNumero}
                className="btn-npl btn-npl-secondary"
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={`/aide?ticket=${encodeURIComponent(ticketCree.numero)}`}
                className="btn-npl btn-npl-primary"
                style={{ textDecoration: 'none', justifyContent: 'center' }}
              >
                <ExternalLink size={16} />
                <span>Suivre le ticket en ligne</span>
              </a>

              <a
                href={`https://wa.me/221708717942?text=${encodeURIComponent(`Bonjour Nopalou, j'ai ouvert le ticket SAV ${ticketCree.numero} concernant ma commande ${commande.reference}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-npl btn-npl-secondary"
                style={{ textDecoration: 'none', justifyContent: 'center' }}
              >
                <span>Accélérer via le Support WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleResetAndClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text3, #888)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          /* Formulaire de déclaration */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '6px' }}>
                Motif du problème
              </label>
              <select
                value={motif}
                onChange={e => setMotif(e.target.value)}
                className="input-npl"
                style={{ width: '100%', height: '42px', fontSize: '13.5px' }}
              >
                {MOTIFS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '6px' }}>
                Description détaillée du litige *
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Expliquez précisément la situation (ex: colis non reçu à l'adresse convenue, article cassé au déballage, taille non conforme...)"
                rows={4}
                required
                className="input-npl"
                style={{ width: '100%', resize: 'vertical', fontSize: '13.5px', padding: '10px 12px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '6px' }}>
                  Votre nom
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  className="input-npl"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '6px' }}>
                  Téléphone WhatsApp *
                </label>
                <input
                  type="tel"
                  value={telephone}
                  onChange={e => setTelephone(e.target.value)}
                  required
                  placeholder="77 123 45 67"
                  className="input-npl"
                  style={{ width: '100%', height: '40px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: '6px' }}>
                Email de confirmation (recommandé)
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

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleResetAndClose}
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
                    <span>Transmission...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Transmettre le signalement</span>
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
