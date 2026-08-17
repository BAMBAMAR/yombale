'use client'
import { useState, useEffect } from 'react'

interface Admin {
  id: string
  nom: string
  email: string
  role: string
  created_at: string
}

export default function BoutiqueAdmins({ boutiqueId }: { boutiqueId: string }) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)

  async function fetchAdmins() {
    const cached = localStorage.getItem(`nopalou_offline_admins_${boutiqueId}`)
    if (cached) {
      try { setAdmins(JSON.parse(cached)) } catch(e) {}
    }
    if (!cached) setLoading(true)

    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/admins`)
      if (!res.ok) throw new Error('Erreur de chargement')
      const data = await res.json()
      setAdmins(data.admins || [])
      localStorage.setItem(`nopalou_offline_admins_${boutiqueId}`, JSON.stringify(data.admins || []))
    } catch (err: any) {
      if (!cached) setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdmins()
  }, [boutiqueId])

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!newEmail) return
    setAdding(true)
    setError(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'ajout")
      setNewEmail('')
      await fetchAdmins()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(adminId: string) {
    if (!confirm('Voulez-vous vraiment retirer cet administrateur ?')) return
    setError(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/admins/${adminId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }
      await fetchAdmins()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading && admins.length === 0) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Administrateurs Web
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
          Ajoutez des utilisateurs (par leur adresse email Nopalou) pour qu&apos;ils puissent gérer votre boutique avec vous.
        </p>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Formulaire d'Ajout d'Admin (Responsive) */}
      <form onSubmit={handleAddAdmin} style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
          Inviter un nouvel administrateur
        </label>
        
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', width: '100%' }}>
          <input 
            type="email" 
            placeholder="Email de l'utilisateur à ajouter (ex: contact@exemple.com)"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            required
            style={{
              flex: '1 1 240px',
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5
            }}
          />
          <button 
            type="submit"
            disabled={adding || !newEmail}
            className="npl-btn npl-btn-primary npl-btn-md"
            style={{ flex: '1 1 140px', color: '#ffffff', whiteSpace: 'nowrap' }}
          >
            <span>{adding ? '⏳' : '👤 +'}</span>
            <span>{adding ? 'Ajout...' : 'Ajouter un admin'}</span>
          </button>
        </div>
      </form>

      {/* Liste des Administrateurs (Cards Responsive) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Membres de l&apos;équipe ({admins.length})
        </h3>

        {admins.map(admin => {
          const isOwner = admin.role === 'propriétaire'
          return (
            <div key={admin.id} className="npl-card-subtle" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              padding: '12px 16px',
              background: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: isOwner ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)' : '#eff6ff',
                  border: isOwner ? '1px solid #fcd34d' : '1px solid #bfdbfe',
                  color: isOwner ? '#92400e' : '#1d4ed8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 16, flexShrink: 0
                }}>
                  {(admin.nom || admin.email || 'A').charAt(0).toUpperCase()}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                      {admin.nom || 'Sans nom'}
                    </span>
                    <span className={`npl-badge ${isOwner ? 'npl-badge-warning' : 'npl-badge-brand'}`} style={{ fontSize: 11 }}>
                      <span className="npl-badge-dot" />
                      <span>{admin.role}</span>
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 2, wordBreak: 'break-all' }}>
                    {admin.email}
                  </div>
                </div>
              </div>

              <div>
                {!isOwner ? (
                  <button 
                    type="button"
                    onClick={() => handleDelete(admin.id)}
                    className="npl-btn npl-btn-danger npl-btn-sm"
                  >
                    <span>🗑️</span>
                    <span>Retirer</span>
                  </button>
                ) : (
                  <span style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600, padding: '4px 8px' }}>
                    Propriétaire principal
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {admins.length === 0 && !loading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
            Aucun administrateur trouvé.
          </div>
        )}
      </div>
    </div>
  )
}
