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

const CODES_PIN_TRIVIAUX = ['1234', '0000', '9999', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '1212']

export default function BoutiqueCaissiers({ boutiqueId }: { boutiqueId: string }) {
  const [caissiers, setCaissiers] = useState<Caissier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  const [newNom, setNewNom] = useState('')
  const [newPrenom, setNewPrenom] = useState('')
  const [newPin, setNewPin] = useState('')
  const [showNewPin, setShowNewPin] = useState(false)
  const [newRole, setNewRole] = useState('caissier')
  const [adding, setAdding] = useState(false)
  const { t } = useTranslation()

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPin, setEditPin] = useState('')
  const [showEditPin, setShowEditPin] = useState(false)
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
    const pinNettoye = newPin.trim()
    if (!/^\d{4,6}$/.test(pinNettoye)) {
      setError('Le code PIN doit comporter entre 4 et 6 chiffres numériques')
      return
    }
    if (CODES_PIN_TRIVIAUX.includes(pinNettoye)) {
      setError('Code PIN trop simple ou par défaut (évitez 1234, 0000, 9999...). Veuillez choisir un code secret personnalisé.')
      return
    }
    setAdding(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: newNom.trim(), prenom: newPrenom.trim(), code_pin: pinNettoye, role: newRole })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('errors.genericError') || "Erreur lors de l'ajout")
      setNewNom('')
      setNewPrenom('')
      setNewPin('')
      setNewRole('caissier')
      setSuccessMsg('✅ Nouveau caissier ajouté avec succès !')
      setTimeout(() => setSuccessMsg(null), 4000)
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
    const pinNettoye = editPin.trim()
    if (!/^\d{4,6}$/.test(pinNettoye)) {
      setError('Le code PIN doit comporter entre 4 et 6 chiffres numériques.')
      return
    }
    if (CODES_PIN_TRIVIAUX.includes(pinNettoye)) {
      setError('Ce code PIN est trop simple ou par défaut (évitez 1234, 0000, 9999...). Veuillez choisir un code secret personnalisé.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers/${caissierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_pin: pinNettoye })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('errors.genericError') || 'Erreur lors de la modification')
      }
      setEditingId(null)
      setEditPin('')
      setSuccessMsg('✅ Code PIN mis à jour avec succès !')
      setTimeout(() => setSuccessMsg(null), 4000)
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

  const caissiersAvecPinTrivial = caissiers.filter(c => c.actif && (!c.code_pin || CODES_PIN_TRIVIAUX.includes(String(c.code_pin).trim())));

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

      {/* Alerte Sécurité Codes PIN par défaut */}
      {caissiersAvecPinTrivial.length > 0 && (
        <div style={{
          background: '#fff7ed',
          border: '1.5px solid #fed7aa',
          borderLeft: '4px solid #ea580c',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 12,
          boxShadow: '0 2px 8px rgba(234, 88, 12, 0.06)'
        }}>
          <span style={{ fontSize: 22 }}>🛡️</span>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#9a3412' }}>
              Action requise : Personnalisez les codes PIN de votre équipe
            </h4>
            <p style={{ margin: 0, fontSize: 12.5, color: '#c2410c', lineHeight: 1.5 }}>
              {caissiersAvecPinTrivial.length} membre(s) utilise(nt) encore un code d&apos;usine par défaut (ex: 1234 ou 0000). Pour accéder à la caisse POS en toute sécurité, veuillez modifier ces codes ci-dessous.
            </p>
          </div>
        </div>
      )}

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
          {t('shop.terminalHelpText')}
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
                <span>{t('shop.openTerminalBtn')}</span>
              </a>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: 10, marginBottom: 20, fontSize: 13, fontWeight: 700 }}>
          {successMsg}
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
            placeholder={t('shop.lastNamePlaceholder')}
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
            placeholder={t('shop.firstNamePlaceholder')}
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
          
          <div style={{ position: 'relative', width: '100%' }}>
            <input 
              type={showNewPin ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={6}
              placeholder="Code PIN (4 à 6 chiffres)"
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              required
              style={{
                padding: '10px 40px 10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13.5,
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowNewPin(!showNewPin)}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: 4
              }}
              title="Afficher/Masquer le code PIN"
            >
              {showNewPin ? '🙈' : '👁️'}
            </button>
          </div>

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
            <option value="caissier">{t('shop.roleCashierStandard')}</option>
            <option value="superviseur">{t('shop.roleCashierSupervisor')}</option>
          </select>
        </div>

        <button 
          type="submit"
          disabled={adding || !newNom || !newPin || newPin.length < 4}
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
          {t('shop.registeredCashiersTitle')} ({caissiers.length})
        </h3>

        {caissiers.map(caissier => {
          const isTrivial = CODES_PIN_TRIVIAUX.includes(String(caissier.code_pin || '').trim());
          const isEditing = editingId === caissier.id;

          return (
            <div key={caissier.id} className="npl-card-subtle" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              padding: '14px 16px',
              background: '#ffffff',
              border: isTrivial ? '1.5px solid #fed7aa' : '1px solid var(--border)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: caissier.actif ? (caissier.role === 'superviseur' ? '#fef3c7' : '#eff6ff') : '#f1f5f9',
                  border: caissier.actif ? (caissier.role === 'superviseur' ? '1px solid #fde68a' : '1px solid #bfdbfe') : '1px solid #cbd5e1',
                  color: caissier.actif ? (caissier.role === 'superviseur' ? '#b45309' : '#1d4ed8') : '#64748b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 16, flexShrink: 0
                }}>
                  {(caissier.nom || 'C').charAt(0).toUpperCase()}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--navy)' }}>
                      {caissier.prenom} {caissier.nom}
                    </span>
                    <span className={`npl-badge ${caissier.actif ? 'npl-badge-success' : 'npl-badge-neutral'}`} style={{ fontSize: 11 }}>
                      <span className="npl-badge-dot" />
                      <span>{caissier.actif ? t('shop.activeStatus') : t('shop.inactiveStatus')}</span>
                    </span>
                    {caissier.role === 'superviseur' && (
                      <span className="npl-badge npl-badge-warning" style={{ fontSize: 11 }}>
                        👑 {t('shop.roleCashierSupervisor')}
                      </span>
                    )}
                    {isTrivial && (
                      <span style={{
                        fontSize: 10.5, fontWeight: 800, color: '#dc2626', background: '#fef2f2',
                        padding: '2px 8px', borderRadius: 6, border: '1px solid #fecaca'
                      }}>
                        ⚠️ PIN d&apos;usine à changer
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative' }}>
                          <input 
                            type={showEditPin ? 'text' : 'password'}
                            inputMode="numeric"
                            maxLength={6}
                            value={editPin}
                            onChange={e => setEditPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="Nouveau PIN"
                            style={{ width: 130, padding: '6px 30px 6px 8px', fontSize: 13, borderRadius: 6, border: '1.5px solid #ea580c', fontWeight: 800 }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowEditPin(!showEditPin)}
                            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
                          >
                            {showEditPin ? '🙈' : '👁️'}
                          </button>
                        </div>
                        <button 
                          onClick={() => handleSavePin(caissier.id)} 
                          disabled={savingEdit || editPin.length < 4}
                          className="npl-btn npl-btn-primary npl-btn-sm"
                          style={{ padding: '6px 12px', fontSize: 12, color: '#ffffff' }}
                        >
                          {savingEdit ? '...' : t('common.save')}
                        </button>
                        <button 
                          onClick={() => { setEditingId(null); setEditPin(''); }}
                          className="npl-btn npl-btn-secondary npl-btn-sm"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                        >
                          {t('common.cancel')}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Code PIN : <strong>••••</strong></span>
                        <button
                          onClick={() => { setEditingId(caissier.id); setEditPin(''); setShowEditPin(false); }}
                          style={{ background: 'none', border: 'none', color: '#ea580c', textDecoration: 'underline', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, padding: '0 4px' }}
                        >
                          ✏️ Modifier le PIN
                        </button>
                      </div>
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
                  title="Supprimer ce caissier"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}

        {caissiers.length === 0 && !loading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text3)', background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
            {t('shop.noCashiersFound')}
          </div>
        )}
      </div>
    </div>
  )
}
