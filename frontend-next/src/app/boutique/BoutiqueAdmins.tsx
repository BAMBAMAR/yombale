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
    setLoading(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/admins`)
      if (!res.ok) throw new Error('Erreur de chargement')
      const data = await res.json()
      setAdmins(data.admins || [])
    } catch (err: any) {
      setError(err.message)
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
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Administrateurs Web</h2>
      <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24 }}>
        Ajoutez des utilisateurs (par leur adresse email Nopalou) pour qu'ils puissent gérer votre boutique avec vous.
      </p>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <input 
          type="email" 
          placeholder="Email de l'utilisateur à ajouter"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          required
          style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
        />
        <button 
          type="submit"
          disabled={adding || !newEmail}
          style={{ 
            background: 'var(--navy)', color: '#fff', border: 'none', 
            padding: '10px 20px', borderRadius: 8, fontWeight: 600, 
            cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 
          }}
        >
          {adding ? 'Ajout...' : 'Ajouter un admin'}
        </button>
      </form>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nom</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rôle</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px' }}>{admin.nom}</td>
                <td style={{ padding: '12px 16px' }}>{admin.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ 
                    background: admin.role === 'propriétaire' ? '#fef3c7' : '#e0e7ff',
                    color: admin.role === 'propriétaire' ? '#92400e' : '#3730a3',
                    padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 
                  }}>
                    {admin.role}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {admin.role !== 'propriétaire' ? (
                    <button 
                      type="button"
                      onClick={() => handleDelete(admin.id)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      Retirer
                    </button>
                  ) : (
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>Intouchable</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admins.length === 0 && !loading && (
          <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
            Aucun administrateur trouvé.
          </div>
        )}
      </div>
    </div>
  )
}
