'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/context'

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
  const { t } = useTranslation()

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPin, setEditPin] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  async function fetchCaissiers() {
    const cached = localStorage.getItem(`nopalou_offline_caissiers_${boutiqueId}`)
    if (cached) {
      try { setCaissiers(JSON.parse(cached)) } catch(e) {}
    }
    if (!cached) setLoading(true)

    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers`)
      if (!res.ok) throw new Error(t('errors.genericError') || 'Erreur de chargement')
      const data = await res.json()
      setCaissiers(data.caissiers || [])
      localStorage.setItem(`nopalou_offline_caissiers_${boutiqueId}`, JSON.stringify(data.caissiers || []))
    } catch (err: any) {
      if (!cached) setError(err.message)
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
      if (!res.ok) throw new Error(data.error || t('errors.genericError') || "Erreur lors de l'ajout")
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
    if (!confirm(t('shop.confirmDeleteCashier'))) return
    setError(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers/${caissierId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('errors.genericError') || 'Erreur lors de la suppression')
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
        throw new Error(data.error || t('errors.genericError') || 'Erreur lors de la modification')
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
        throw new Error(data.error || t('errors.genericError') || 'Erreur lors de la modification')
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

  if (loading && caissiers.length === 0) return <div style={{ padding: 40, textAlign: 'center' }}>{t('common.loading')}</div>

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {t('shop.caissiersTitle')}
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
          {t('shop.teamDesc')}
        </p>
      </div>

      {/* Bloc Lien Terminal Caissier (0 Débordement) */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #bfdbfe',
        borderLeft: '4px solid #2563eb',
        borderRadius: 16,
        padding: '16px 18px',
        marginBottom: 24,
        boxShadow: '0 2px 10px rgba(37, 99, 235, 0.04)',
        boxSizing: 'border-box',
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0
          }}>
            📱
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e40af' }}>
            {t('caisse.terminalCashier')}
          </h3>
        </div>
        
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>
          Ouvrez ce lien sur la tablette ou le PC du magasin. Vos caissiers déverrouilleront leur session avec leur <strong>Code PIN (4 chiffres)</strong>.
        </p>

        {terminalUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', boxSizing: 'border-box' }}>
            <input
              type="text"
              readOnly
              value={terminalUrl}
              style={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                fontSize: 12.5,
                fontWeight: 600,
                color: '#1e40af',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            />
            
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(terminalUrl)
                  setCopie(true)
                  setTimeout(() => setCopie(false), 3000)
                }}
                className="npl-btn npl-btn-primary npl-btn-md"
                style={{ flex: '1 1 180px', color: '#ffffff' }}
              >
                <span>{copie ? '✅' : '📋'}</span>
                <span>{copie ? t('account.copied') : t('account.copyLink')}</span>
              </button>

              <a
                href={terminalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="npl-btn npl-btn-secondary npl-btn-md"
                style={{ flex: '1 1 140px', textDecoration: 'none' }}
              >
                <span>↗</span>
                <span>Ouvrir terminal</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Formulaire d'Ajout de Caissier (Responsive) */}
      <form onSubmit={handleAddCaissier} style={{
        background: '#ffffff',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
      }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
          {t('shop.addCashier')}
        </label>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, width: '100%' }}>
          <input 
            type="text" 
            placeholder="Nom (ex: Diop)"
            value={newNom}
            onChange={e => setNewNom(e.target.value)}
            required
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
          <input 
            type="text" 
            placeholder="Prénom (ex: Aminata)"
            value={newPrenom}
            onChange={e => setNewPrenom(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
          <input 
            type="password" 
            maxLength={6}
            placeholder={t('shop.pinCode')}
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            required
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
          <select
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              background: '#ffffff',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            <option value="caissier">Caissier Standard</option>
            <option value="superviseur">Superviseur / Responsable</option>
          </select>
        </div>

        <button 
          type="submit"
          disabled={adding || !newNom || !newPin}
          className="npl-btn npl-btn-primary npl-btn-md"
          style={{ width: '100%', color: '#ffffff', justifySelf: 'stretch' }}
        >
          <span>{adding ? '⏳' : '🏪 +'}</span>
          <span>{adding ? t('common.loading') : t('shop.addCashier')}</span>
        </button>
      </form>

      {/* Liste des Caissiers (Cards Responsive) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--navy)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Caissiers Enregistrés ({caissiers.length})
        </h3>

        {caissiers.map(caissier => (
          <div key={caissier.id} className="npl-card-subtle" style={{
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
                background: caissier.actif ? '#eff6ff' : '#f1f5f9',
                border: caissier.actif ? '1px solid #bfdbfe' : '1px solid #cbd5e1',
                color: caissier.actif ? '#1d4ed8' : '#64748b',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16, flexShrink: 0
              }}>
                {(caissier.nom || 'C').charAt(0).toUpperCase()}
              </div>

              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)' }}>
                    {caissier.prenom} {caissier.nom}
                  </span>
                  <span className={`npl-badge ${caissier.actif ? 'npl-badge-success' : 'npl-badge-neutral'}`} style={{ fontSize: 11 }}>
                    <span className="npl-badge-dot" />
                    <span>{caissier.actif ? t('shop.activeStatus') : t('shop.inactiveStatus')}</span>
                  </span>
                  {caissier.role === 'superviseur' && (
                    <span className="npl-badge npl-badge-warning" style={{ fontSize: 11 }}>
                      Superviseur
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {editingId === caissier.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <input 
                        type="password"
                        maxLength={6}
                        value={editPin}
                        onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))}
                        placeholder={t('shop.pinCode')}
                        style={{ width: 100, padding: '4px 8px', fontSize: 12, borderRadius: 6, border: '1px solid #cbd5e1' }}
                      />
                      <button 
                        onClick={() => handleSavePin(caissier.id)} 
                        disabled={savingEdit || editPin.length < 4}
                        className="npl-btn npl-btn-primary npl-btn-sm"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        {t('common.save')}
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="npl-btn npl-btn-secondary npl-btn-sm"
                        style={{ padding: '3px 8px', fontSize: 11 }}
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <span>PIN: •••• <button onClick={() => { setEditingId(caissier.id); setEditPin(''); }} style={{ background: 'none', border: 'none', color: 'var(--navy)', textDecoration: 'underline', cursor: 'pointer', fontSize: 11, padding: '0 4px' }}>{t('common.edit')}</button></span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button 
                type="button"
                onClick={() => handleToggleActif(caissier)}
                className={`npl-btn ${caissier.actif ? 'npl-btn-secondary' : 'npl-btn-success'} npl-btn-sm`}
              >
                {caissier.actif ? t('shop.inactiveStatus') : t('shop.activeStatus')}
              </button>
              <button 
                type="button"
                onClick={() => handleDelete(caissier.id)}
                className="npl-btn npl-btn-danger npl-btn-sm"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {caissiers.length === 0 && !loading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
            Aucun caissier enregistré pour cette boutique.
          </div>
        )}
      </div>
    </div>
  )
}
