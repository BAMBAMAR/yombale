'use client'
import { useState } from 'react'

interface Produit { id: string; nom: string; prix: number | null }

const inputStyle = {
  padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8,
  fontSize: 14, width: '100%', background: '#fff', boxSizing: 'border-box' as const,
}
const labelStyle = { fontSize: 13, fontWeight: 600 as const, color: '#374151', display: 'block' as const, marginBottom: 4 }

export default function CommanderModal({
  boutiqueId,
  produit,
  onClose,
}: {
  boutiqueId: string
  produit: Produit
  onClose: () => void
}) {
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [adresse, setAdresse] = useState('')
  const [quantite, setQuantite] = useState(1)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''
  const total = produit.prix ? produit.prix * quantite : null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${backendUrl}/api/comptabilite/${boutiqueId}/commandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: produit.id,
          quantite,
          client_nom: nom,
          client_telephone: tel,
          client_adresse: adresse || undefined,
          note: note || undefined,
          source: 'web',
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erreur lors de la commande'); setLoading(false); return }
      setSuccess(true)
    } catch {
      setError('Impossible de joindre le serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
            <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 20, marginBottom: 8 }}>Commande envoyée !</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
              La boutique va vous contacter sur le <strong>{tel}</strong> pour confirmer votre commande.
            </p>
            <button onClick={onClose} style={{ background: '#C75B00', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: 18, margin: '0 0 4px' }}>Commander</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>{produit.nom}</p>
              </div>
              <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af', padding: 4 }}>✕</button>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13 }}>
                {error}
              </div>
            )}

            <div>
              <label style={labelStyle}>Votre nom *</label>
              <input required value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} placeholder="Prénom et nom" />
            </div>

            <div>
              <label style={labelStyle}>Téléphone (WhatsApp) *</label>
              <input required type="tel" value={tel} onChange={e => setTel(e.target.value)} style={inputStyle} placeholder="77 000 00 00" />
            </div>

            <div>
              <label style={labelStyle}>Quantité</label>
              <input type="number" min={1} max={99} value={quantite} onChange={e => setQuantite(Number(e.target.value))} style={{ ...inputStyle, width: 100 }} />
            </div>

            <div>
              <label style={labelStyle}>Adresse de livraison</label>
              <input value={adresse} onChange={e => setAdresse(e.target.value)} style={inputStyle} placeholder="Quartier, rue, point de repère…" />
            </div>

            <div>
              <label style={labelStyle}>Note / message</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="Couleur, taille, précisions…" />
            </div>

            {total && (
              <div style={{ background: '#fff7ed', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>Total estimé</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: '#C75B00' }}>
                  {new Intl.NumberFormat('fr-FR').format(total)} FCFA
                </span>
              </div>
            )}

            <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
              La boutique vous contactera sur WhatsApp pour confirmer et organiser la livraison ou le retrait.
            </p>

            <button type="submit" disabled={loading} style={{
              background: loading ? '#94a3b8' : '#C75B00', color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(199,91,0,.3)',
            }}>
              {loading ? 'Envoi en cours…' : 'Envoyer ma commande'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
