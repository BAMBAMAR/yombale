'use client'
import { useState, useEffect } from 'react'

interface Caissier {
  id: string
  nom: string
  prenom: string
  code_pin: string
  role: string
  actif: boolean
}

export default function BoutiqueCaissiers({ boutiqueId }: { boutiqueId: string }) {
  const [caissiers, setCaissiers] = useState<Caissier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [newNom, setNewNom] = useState('')
  const [newPrenom, setNewPrenom] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newRole, setNewRole] = useState('caissier')
  const [adding, setAdding] = useState(false)

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPin, setEditPin] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  async function fetchCaissiers() {
    setLoading(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers`)
      if (!res.ok) throw new Error('Erreur de chargement')
      const data = await res.json()
      setCaissiers(data.caissiers || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaissiers()
  }, [boutiqueId])

  async function handleAddCaissier(e: React.FormEvent) {
    e.preventDefault()
    if (!newNom || !newPin) return
    if (newPin.length < 4) {
      setError('Le code PIN doit comporter au moins 4 chiffres')
      return
    }
    setAdding(true)
    setError(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newNom, prenom: newPrenom, code_pin: newPin, role: newRole })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'ajout")
      setNewNom('')
      setNewPrenom('')
      setNewPin('')
      setNewRole('caissier')
      await fetchCaissiers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(caissierId: string) {
    if (!confirm('Voulez-vous vraiment supprimer ce caissier ?')) return
    setError(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers/${caissierId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la suppression')
      }
      await fetchCaissiers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleToggleActif(caissier: Caissier) {
    setError(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers/${caissier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !caissier.actif })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la modification')
      }
      await fetchCaissiers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleSavePin(caissierId: string) {
    if (editPin.length < 4) {
      setError('Le code PIN doit comporter au moins 4 chiffres')
      return
    }
    setSavingEdit(true)
    setError(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers/${caissierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_pin: editPin })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erreur lors de la modification')
      }
      setEditingId(null)
      setEditPin('')
      await fetchCaissiers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  const [caisseToken, setCaisseToken] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    if (!boutiqueId) return
    fetch(`/api/boutiques/${boutiqueId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const token = data?.caisse_token || data?.boutique?.caisse_token || boutiqueId
        setCaisseToken(token)
      })
      .catch(() => setCaisseToken(boutiqueId))
  }, [boutiqueId])

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
  const activeToken = caisseToken || boutiqueId
  const terminalUrl = `${siteUrl}/boutique/caisse?token=${activeToken}`

  if (loading && caissiers.length === 0) return <div style={{ padding: 40, textAlign: 'center' }}>Chargement...</div>

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Caissiers POS (Point de vente physique)</h2>
      <p style={{ color: 'var(--text3)', fontSize: 14, marginBottom: 24 }}>
        Gérez les employés qui peuvent utiliser l&apos;application de caisse physique locale. Chaque caissier a besoin d&apos;un code PIN pour ouvrir sa session.
      </p>

      {/* Bloc Lien Terminal Caissier */}
      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #93c5fd', borderRadius: 14, padding: 20, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>📱</span>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1e40af' }}>Lien Terminal Caissier Dédié (Sans Mot de Passe Admin)</h3>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#1e3a5f', lineHeight: 1.5 }}>
          Ouvrez ce lien une fois sur la tablette ou le PC du magasin et ajoutez-le en Favoris / Écran d&apos;accueil. Vos caissiers pourront déverrouiller leur session avec leur <strong>Code PIN (4 chiffres)</strong> sans jamais avoir accès à votre compte propriétaire ni à vos paramètres.
        </p>
        {terminalUrl && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={terminalUrl}
              style={{ flex: 1, minWidth: 260, padding: '10px 14px', borderRadius: 8, border: '1px solid #93c5fd', background: '#fff', fontSize: 13, fontWeight: 600, color: '#1e40af' }}
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(terminalUrl)
                setCopie(true)
                setTimeout(() => setCopie(false), 3000)
              }}
              style={{ padding: '10px 18px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {copie ? '✅ Lien copié !' : '📋 Copier le lien terminal'}
            </button>
            <a
              href={terminalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '10px 18px', background: '#ffffff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              ↗ Tester le terminal
            </a>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 24, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div style={{ background: '#f9fafb', padding: 20, borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16 }}>Ajouter un caissier</h3>
        <form onSubmit={handleAddCaissier} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 600 }}>Nom *</label>
            <input 
              type="text" 
              value={newNom}
              onChange={e => setNewNom(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 600 }}>Prénom</label>
            <input 
              type="text" 
              value={newPrenom}
              onChange={e => setNewPrenom(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 600 }}>Code PIN (connexion) *</label>
            <input 
              type="text" 
              maxLength={10}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              required
              placeholder="Ex: 1234"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 600 }}>Rôle</label>
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
            >
              <option value="caissier">Caissier</option>
              <option value="superviseur">Superviseur</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
            <button 
              type="submit"
              disabled={adding || !newNom || !newPin}
              style={{ 
                background: 'var(--navy)', color: '#fff', border: 'none', 
                padding: '10px 20px', borderRadius: 8, fontWeight: 600, 
                cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 
              }}
            >
              {adding ? 'Ajout...' : 'Créer le caissier'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14, minWidth: 550 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nom</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rôle</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Code PIN</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Statut</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {caissiers.map(caissier => (
                <tr key={caissier.id} style={{ borderBottom: '1px solid #f3f4f6', opacity: caissier.actif ? 1 : 0.6 }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                    {caissier.prenom} {caissier.nom}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ 
                      background: caissier.role === 'superviseur' ? '#fef3c7' : '#e0e7ff',
                      color: caissier.role === 'superviseur' ? '#92400e' : '#3730a3',
                      padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 600 
                    }}>
                      {caissier.role}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {editingId === caissier.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input 
                          type="text" 
                          maxLength={10}
                          value={editPin}
                          onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))}
                          style={{ width: 80, padding: '4px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, fontFamily: 'monospace' }}
                        />
                        <button onClick={() => handleSavePin(caissier.id)} disabled={savingEdit} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✓</button>
                        <button onClick={() => setEditingId(null)} style={{ background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', letterSpacing: 2, fontSize: 16 }}>{caissier.code_pin}</span>
                        <button onClick={() => { setEditingId(caissier.id); setEditPin(caissier.code_pin); }} style={{ background: 'none', border: 'none', color: 'var(--navy)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>Modifier</button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                      onClick={() => handleToggleActif(caissier)}
                      style={{ 
                        background: caissier.actif ? '#dcfce7' : '#fef2f2', 
                        color: caissier.actif ? '#16a34a' : '#dc2626', 
                        border: 'none', padding: '4px 10px', borderRadius: 12, 
                        fontWeight: 600, fontSize: 12, cursor: 'pointer' 
                      }}
                    >
                      {caissier.actif ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button 
                      type="button"
                      onClick={() => handleDelete(caissier.id)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {caissiers.length === 0 && !loading && (
          <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>
            Aucun caissier configuré.
          </div>
        )}
      </div>
    </div>
  )
}
