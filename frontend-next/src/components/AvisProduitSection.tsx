'use client'

import React, { useState, useEffect } from 'react'

interface Avis {
  id: string
  client_nom: string
  note: number
  commentaire: string
  commande_ref?: string
  created_at: string
}

interface AvisProduitSectionProps {
  boutiqueId: string
  produitId: string
}

export default function AvisProduitSection({ boutiqueId, produitId }: AvisProduitSectionProps) {
  const [avis, setAvis] = useState<Avis[]>([])
  const [noteMoyenne, setNoteMoyenne] = useState<number>(0)
  const [totalAvis, setTotalAvis] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  // Formulaire d'ajout
  const [clientNom, setClientNom] = useState('')
  const [noteForm, setNoteForm] = useState(5)
  const [commentaireForm, setCommentaireForm] = useState('')
  const [commandeRef, setCommandeRef] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msgSuccess, setMsgSuccess] = useState<string | null>(null)
  const [msgError, setMsgError] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    fetch(`${backendUrl}/api/boutiques/${boutiqueId}/produits/${produitId}/avis`)
      .then(r => r.ok ? r.json() : { avis: [], note_moyenne: 0, total_avis: 0 })
      .then(data => {
        setAvis(data.avis || [])
        setNoteMoyenne(data.note_moyenne || 0)
        setTotalAvis(data.total_avis || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [boutiqueId, produitId, backendUrl])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clientNom.trim() || !commentaireForm.trim()) return

    setSubmitting(true)
    setMsgSuccess(null)
    setMsgError(null)

    try {
      const res = await fetch(`${backendUrl}/api/boutiques/${boutiqueId}/produits/${produitId}/avis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_nom: clientNom,
          note: noteForm,
          commentaire: commentaireForm,
          commande_ref: commandeRef || undefined,
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setMsgError(data.error || 'Erreur lors de la publication de votre avis.')
      } else {
        setMsgSuccess('✅ Votre avis a été publié avec succès !')
        setAvis(prev => [data.avis, ...prev])
        setTotalAvis(prev => prev + 1)
        setClientNom('')
        setCommentaireForm('')
        setCommandeRef('')
      }
    } catch {
      setMsgError('Erreur réseau lors de la publication.')
    } finally {
      setSubmitting(false)
    }
  }

  function renderStars(n: number) {
    return '⭐'.repeat(n)
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
      padding: 20,
      marginTop: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-archivo), sans-serif', fontSize: 16, fontWeight: 700, color: '#1C2B4A', margin: 0 }}>
            ⭐ Avis Clients Vérifiés
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6b7280' }}>
            {totalAvis > 0 ? `${totalAvis} avis d'acheteurs certifiés` : 'Soyez le premier à donner votre avis !'}
          </p>
        </div>

        {totalAvis > 0 && (
          <div style={{ background: '#fef3c7', padding: '6px 14px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{noteMoyenne}</span>
            <span style={{ fontSize: 13, color: '#b45309' }}>/ 5 ⭐</span>
          </div>
        )}
      </div>

      {/* Formulaire de dépôt d'avis */}
      <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#334155' }}>
          💬 Donner votre avis sur ce produit
        </h4>

        {msgSuccess && <p style={{ color: '#16a34a', fontSize: 12, fontWeight: 700, margin: '0 0 10px' }}>{msgSuccess}</p>}
        {msgError && <p style={{ color: '#dc2626', fontSize: 12, fontWeight: 700, margin: '0 0 10px' }}>{msgError}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Votre Prénom & Nom *</label>
            <input
              required
              type="text"
              value={clientNom}
              onChange={e => setClientNom(e.target.value)}
              placeholder="ex: Aminata Diallo"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Note (1 à 5 ⭐) *</label>
            <select
              value={noteForm}
              onChange={e => setNoteForm(Number(e.target.value))}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
            >
              <option value={5}>⭐⭐⭐⭐⭐ (5/5 Parfait)</option>
              <option value={4}>⭐⭐⭐⭐ (4/5 Très Bon)</option>
              <option value={3}>⭐⭐⭐ (3/3 Moyen)</option>
              <option value={2}>⭐⭐ (2/5 Passable)</option>
              <option value={1}>⭐ (1/5 Décevant)</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>N° de commande (Optionnel)</label>
            <input
              type="text"
              value={commandeRef}
              onChange={e => setCommandeRef(e.target.value)}
              placeholder="ex: CMD-2026-1045"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13 }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Votre Commentaire *</label>
          <textarea
            required
            rows={2}
            value={commentaireForm}
            onChange={e => setCommentaireForm(e.target.value)}
            placeholder="Partagez votre expérience sur la qualité, la taille et le produit..."
            style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            background: '#1C2B4A', color: '#fff', border: 'none', borderRadius: 6,
            padding: '8px 18px', fontWeight: 700, fontSize: 12, cursor: 'pointer'
          }}
        >
          {submitting ? 'Publication...' : 'Publier mon avis'}
        </button>
      </form>

      {/* Liste des avis clients */}
      {loading ? (
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Chargement des avis...</p>
      ) : avis.length === 0 ? (
        <p style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>Aucun avis pour l&apos;instant. Soyez le premier !</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {avis.map(a => (
            <div key={a.id} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                  {a.client_nom} {a.commande_ref ? <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: 4 }}>Acheteur Vérifié</span> : null}
                </span>
                <span style={{ fontSize: 12 }}>{renderStars(a.note)}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#475569', lineHeight: 1.4 }}>{a.commentaire}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
