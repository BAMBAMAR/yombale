'use client'

import { useState, useTransition } from 'react'
import { Flag, Plus, Search, CheckCircle2, XCircle, Sparkles, Sliders, Shield, Zap, RefreshCw, Layers } from 'lucide-react'

interface FeatureFlag {
  key: string
  label: string
  description?: string
  categorie: string
  enabled: boolean
  scope: string
  meta?: any
  updated_at?: string
}

const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'tous', label: 'Tous les modules', icon: '⚡' },
  { id: 'pos', label: 'Caisse & POS', icon: '🖥️' },
  { id: 'whatsapp', label: 'WhatsApp & IA', icon: '🤖' },
  { id: 'stock', label: 'Stock & Inventaire', icon: '📦' },
  { id: 'commerce', label: 'Commerce & Ventes', icon: '🛍️' },
  { id: 'marketing', label: 'Marketing & Fidélité', icon: '🎁' },
  { id: 'finance', label: 'Finances & Affiliation', icon: '💳' },
  { id: 'tech', label: 'API & Développeur', icon: '🔌' },
]

export default function AdminFeatureFlagsClient({
  initialFlags,
  secret,
}: {
  initialFlags: FeatureFlag[]
  secret: string
}) {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags)
  const [q, setQ] = useState('')
  const [activeCat, setActiveCat] = useState('tous')
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [notification, setNotification] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [, startTransition] = useTransition()

  // Formulaire nouveau flag
  const [newKey, setNewKey] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCat, setNewCat] = useState('general')
  const [newScope, setNewScope] = useState('global')
  const [newEnabled, setNewEnabled] = useState(true)

  const showToast = (type: 'ok' | 'err', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4000)
  }

  // Filtrage
  const filteredFlags = flags.filter(f => {
    const matchCat = activeCat === 'tous' || f.categorie === activeCat
    const term = q.trim().toLowerCase()
    const matchSearch =
      !term ||
      f.key.toLowerCase().includes(term) ||
      f.label.toLowerCase().includes(term) ||
      (f.description && f.description.toLowerCase().includes(term))
    return matchCat && matchSearch
  })

  // Toggle état
  const handleToggle = async (flag: FeatureFlag) => {
    const nextState = !flag.enabled
    setLoadingKey(flag.key)

    try {
      const res = await fetch(`/api/feature-flags/admin/${flag.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({ enabled: nextState }),
      })

      if (res.ok) {
        setFlags(prev =>
          prev.map(f => (f.key === flag.key ? { ...f, enabled: nextState } : f))
        )
        showToast('ok', `Module "${flag.label}" ${nextState ? 'activé' : 'désactivé'} avec succès !`)
      } else {
        const err = await res.json()
        showToast('err', err.error || 'Erreur lors de la mise à jour')
      }
    } catch (e: any) {
      showToast('err', e.message || 'Erreur de connexion')
    } finally {
      setLoadingKey(null)
    }
  }

  // Changer le scope
  const handleScopeChange = async (flag: FeatureFlag, nextScope: string) => {
    setLoadingKey(flag.key)
    try {
      const res = await fetch(`/api/feature-flags/admin/${flag.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({ scope: nextScope }),
      })

      if (res.ok) {
        setFlags(prev =>
          prev.map(f => (f.key === flag.key ? { ...f, scope: nextScope } : f))
        )
        showToast('ok', `Portée de "${flag.label}" changée en : ${nextScope}`)
      } else {
        const err = await res.json()
        showToast('err', err.error || 'Erreur de modification de portée')
      }
    } catch (e: any) {
      showToast('err', e.message || 'Erreur de connexion')
    } finally {
      setLoadingKey(null)
    }
  }

  // Création d'un nouveau drapeau
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim() || !newLabel.trim()) return

    try {
      const res = await fetch('/api/feature-flags/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({
          key: newKey,
          label: newLabel,
          description: newDesc,
          categorie: newCat,
          scope: newScope,
          enabled: newEnabled,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setFlags(prev => [data.flag, ...prev.filter(f => f.key !== data.flag.key)])
        setShowCreateModal(false)
        setNewKey('')
        setNewLabel('')
        setNewDesc('')
        showToast('ok', `Feature Flag ${data.flag.key} créé avec succès !`)
      } else {
        const err = await res.json()
        showToast('err', err.error || 'Erreur de création')
      }
    } catch (e: any) {
      showToast('err', e.message || 'Erreur réseau')
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 60 }}>
      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            color: '#fff',
            backgroundColor: notification.type === 'ok' ? '#16a34a' : '#dc2626',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {notification.type === 'ok' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {notification.text}
        </div>
      )}

      {/* En-tête Page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="admin-page-titre" style={{ margin: 0 }}>
            🚩 Feature Flags (No-Code)
            <span className="admin-page-count">{flags.length}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Activez, désactivez ou restreignez instantanément les fonctionnalités de la plateforme sans aucun déploiement de code.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#9333ea',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={16} /> Nouveau Feature Flag
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres de catégories */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0', marginBottom: 24 }}>
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Rechercher par clé (ex: POS_ENABLED), nom ou description..."
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: 14,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Pilules de catégories */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: activeCat === cat.id ? '1px solid #9333ea' : '1px solid #e2e8f0',
                background: activeCat === cat.id ? '#f3e8ff' : '#f8fafc',
                color: activeCat === cat.id ? '#9333ea' : '#475569',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grille des Feature Flags */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {filteredFlags.map(flag => {
          const isLoading = loadingKey === flag.key

          return (
            <div
              key={flag.key}
              style={{
                background: '#fff',
                borderRadius: 12,
                border: flag.enabled ? '1px solid #c084fc' : '1px solid #e2e8f0',
                boxShadow: flag.enabled ? '0 4px 12px rgba(147, 51, 234, 0.06)' : '0 2px 4px rgba(0,0,0,0.02)',
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 12,
                      fontWeight: 700,
                      background: '#f1f5f9',
                      color: '#475569',
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {flag.key}
                  </span>

                  {/* Interrupteur Switch */}
                  <label
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: 44,
                      height: 24,
                      cursor: isLoading ? 'wait' : 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={flag.enabled}
                      disabled={isLoading}
                      onChange={() => handleToggle(flag)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: flag.enabled ? '#9333ea' : '#cbd5e1',
                        borderRadius: 24,
                        transition: '0.2s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          height: 18,
                          width: 18,
                          left: flag.enabled ? 22 : 3,
                          bottom: 3,
                          backgroundColor: '#fff',
                          borderRadius: '50%',
                          transition: '0.2s',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                      />
                    </span>
                  </label>
                </div>

                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                  {flag.label}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                  {flag.description || 'Aucune description fournie.'}
                </p>
              </div>

              {/* Barre inférieure de portée et statut */}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: flag.enabled ? '#16a34a' : '#94a3b8',
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: flag.enabled ? '#16a34a' : '#64748b' }}>
                    {flag.enabled ? 'Actif' : 'Désactivé'}
                  </span>
                </div>

                {/* Sélecteur de Portée */}
                <select
                  value={flag.scope || 'global'}
                  onChange={e => handleScopeChange(flag, e.target.value)}
                  disabled={isLoading}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#334155',
                  }}
                >
                  <option value="global">🌍 Toute la plateforme</option>
                  <option value="plan">💎 Forfaits Pro/Business</option>
                  <option value="boutique">🏪 Boutiques sélectionnées</option>
                  <option value="beta">🧪 Testeurs Bêta</option>
                </select>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Création Feature Flag */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: 24,
              maxWidth: 500,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
              ✨ Créer un nouveau Feature Flag
            </h2>

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Clé système (ex: NOUVEAU_MODULE_IA)
                </label>
                <input
                  type="text"
                  required
                  placeholder="EX: VENTE_FLASH_ENABLED"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value.toUpperCase())}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Libellé lisible
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ventes Flash & Comptes à Rebours"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Description de la règle
                </label>
                <textarea
                  rows={2}
                  placeholder="Expliquez ce que ce drapeau active ou désactive..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Catégorie
                  </label>
                  <select
                    value={newCat}
                    onChange={e => setNewCat(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  >
                    <option value="general">Général</option>
                    <option value="pos">Caisse & POS</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="stock">Stock</option>
                    <option value="commerce">Commerce</option>
                    <option value="marketing">Marketing</option>
                    <option value="finance">Finance</option>
                    <option value="tech">Tech & API</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Portée initiale
                  </label>
                  <select
                    value={newScope}
                    onChange={e => setNewScope(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  >
                    <option value="global">Toute la plateforme</option>
                    <option value="plan">Forfaits Pro/Business</option>
                    <option value="boutique">Boutique spécifique</option>
                    <option value="beta">Bêta-testeurs</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <input
                  type="checkbox"
                  id="enabledCheck"
                  checked={newEnabled}
                  onChange={e => setNewEnabled(e.target.checked)}
                />
                <label htmlFor="enabledCheck" style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Activer immédiatement ce module
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#9333ea',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Créer le Flag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
