'use client'

import { useState } from 'react'
import { Crown, Plus, CheckCircle2, XCircle, Edit3, Trash2, Users, Check, AlertCircle, Eye, EyeOff, Tag, Shield, Sparkles } from 'lucide-react'
import { fcfa } from '@/lib/format'

interface Plan {
  id: string
  slug: string
  label: string
  prix_mensuel: number
  badge?: string | null
  couleur?: string
  avantages: string[]
  limites: Record<string, any>
  ordre: number
  actif: boolean
  visibilite?: string
  description?: string
  nb_abonnes_actifs?: number
}

export default function AdminPlansClient({
  initialPlans,
  secret,
}: {
  initialPlans: Plan[]
  secret: string
}) {
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Formulaire plan
  const [formSlug, setFormSlug] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formPrix, setFormPrix] = useState(0)
  const [formBadge, setFormBadge] = useState('')
  const [formCouleur, setFormCouleur] = useState('#0284c7')
  const [formDescription, setFormDescription] = useState('')
  const [formOrdre, setFormOrdre] = useState(0)
  const [formActif, setFormActif] = useState(true)
  const [formMaxProduits, setFormMaxProduits] = useState(100)
  const [formMaxCaissiers, setFormMaxCaissiers] = useState(1)
  const [formAvantages, setFormAvantages] = useState<string[]>([])
  const [newAvantageText, setNewAvantageText] = useState('')

  const showToast = (type: 'ok' | 'err', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4500)
  }

  const openCreate = () => {
    setEditingPlan(null)
    setFormSlug('')
    setFormLabel('')
    setFormPrix(5000)
    setFormBadge('Nouveau')
    setFormCouleur('#0284c7')
    setFormDescription('')
    setFormOrdre(plans.length)
    setFormActif(true)
    setFormMaxProduits(100)
    setFormMaxCaissiers(1)
    setFormAvantages(['Accès aux outils boutique', 'Support client dédié'])
    setShowModal(true)
  }

  const openEdit = (p: Plan) => {
    setEditingPlan(p)
    setFormSlug(p.slug)
    setFormLabel(p.label)
    setFormPrix(p.prix_mensuel || 0)
    setFormBadge(p.badge || '')
    setFormCouleur(p.couleur || '#0284c7')
    setFormDescription(p.description || '')
    setFormOrdre(p.ordre || 0)
    setFormActif(p.actif !== false)
    setFormMaxProduits(p.limites?.max_produits || 100)
    setFormMaxCaissiers(p.limites?.max_caissiers || 1)
    setFormAvantages(Array.isArray(p.avantages) ? [...p.avantages] : [])
    setShowModal(true)
  }

  const addAvantage = () => {
    if (!newAvantageText.trim()) return
    setFormAvantages(prev => [...prev, newAvantageText.trim()])
    setNewAvantageText('')
  }

  const removeAvantage = (index: number) => {
    setFormAvantages(prev => prev.filter((_, i) => i !== index))
  }

  // Enregistrer (Créer / Modifier)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formLabel.trim()) return

    const isEdit = Boolean(editingPlan)
    const url = isEdit ? `/api/plans/admin/${editingPlan!.id}` : '/api/plans/admin'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({
          slug: formSlug,
          label: formLabel,
          prix_mensuel: formPrix,
          badge: formBadge,
          couleur: formCouleur,
          description: formDescription,
          ordre: formOrdre,
          actif: formActif,
          avantages: formAvantages,
          limites: {
            max_produits: formMaxProduits,
            max_caissiers: formMaxCaissiers,
          },
        }),
      })

      const data = await res.json()
      if (res.ok) {
        if (isEdit) {
          setPlans(prev => prev.map(p => (p.id === editingPlan!.id ? { ...p, ...data.plan } : p)))
          showToast('ok', `Forfait "${formLabel}" mis à jour !`)
        } else {
          setPlans(prev => [...prev, data.plan])
          showToast('ok', `Forfait "${formLabel}" créé avec succès !`)
        }
        setShowModal(false)
      } else {
        showToast('err', data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur réseau')
    }
  }

  // Toggle Actif / Inactif
  const handleToggleActif = async (p: Plan) => {
    const nextState = !p.actif
    setLoadingId(p.id)

    try {
      const res = await fetch(`/api/plans/admin/${p.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({ actif: nextState }),
      })

      if (res.ok) {
        setPlans(prev => prev.map(item => (item.id === p.id ? { ...item, actif: nextState } : item)))
        showToast('ok', `Forfait "${p.label}" ${nextState ? 'activé' : 'masqué'}.`)
      } else {
        const d = await res.json()
        showToast('err', d.error || 'Erreur')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur de connexion')
    } finally {
      setLoadingId(null)
    }
  }

  // Suppression
  const handleDelete = async (p: Plan) => {
    if (!confirm(`Supprimer ou désactiver le forfait "${p.label}" ?`)) return
    setLoadingId(p.id)

    try {
      const res = await fetch(`/api/plans/admin/${p.id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Secret': secret },
      })

      const data = await res.json()
      if (res.ok) {
        if (data.desactive) {
          setPlans(prev => prev.map(item => (item.id === p.id ? { ...item, actif: false } : item)))
          showToast('ok', data.message)
        } else {
          setPlans(prev => prev.filter(item => item.id !== p.id))
          showToast('ok', `Forfait "${p.label}" supprimé.`)
        }
      } else {
        showToast('err', data.error || 'Erreur de suppression')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur de connexion')
    } finally {
      setLoadingId(null)
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
            💎 Plans Tarifaires & Abonnements
            <span className="admin-page-count">{plans.length}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Définissez les prix, fonctionnalités incluses, badges, limites et textes marketing de chaque formule sans modifier une seule ligne de code.
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} /> Créer un Forfait
        </button>
      </div>

      {/* Grille des Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {plans.map(p => {
          const isBusy = loadingId === p.id

          return (
            <div
              key={p.slug}
              style={{
                background: '#fff',
                borderRadius: 14,
                border: `2px solid ${p.actif ? p.couleur || '#0284c7' : '#e2e8f0'}`,
                boxShadow: p.actif ? '0 4px 16px rgba(0,0,0,0.06)' : '0 2px 4px rgba(0,0,0,0.02)',
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: p.actif ? 1 : 0.65,
                position: 'relative',
              }}
            >
              <div>
                {/* En-tête de Carte */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {p.slug}
                    </span>
                    <h3 style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                      {p.label}
                    </h3>
                  </div>

                  {p.badge && (
                    <span
                      style={{
                        backgroundColor: p.couleur || '#0284c7',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                      }}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Prix */}
                <div style={{ margin: '14px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#1e293b' }}>
                    {p.prix_mensuel === 0 ? 'GRATUIT' : fcfa(p.prix_mensuel)}
                    {p.prix_mensuel > 0 && <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}> / mois</span>}
                  </div>
                  {p.description && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Limites & Abonnés actifs */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                    📦 Max: {p.limites?.max_produits || 'Illimité'} produits
                  </span>
                  <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                    👥 Max: {p.limites?.max_caissiers || 1} caissier(s)
                  </span>
                  {p.nb_abonnes_actifs !== undefined && (
                    <span style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#047857' }}>
                      <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {p.nb_abonnes_actifs} abonné(s) actif(s)
                    </span>
                  )}
                </div>

                {/* Liste des Avantages */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Avantages inclus :
                  </span>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none' }}>
                    {p.avantages?.map((av, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <Check size={15} color={p.couleur || '#16a34a'} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{av}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actions Inférieures */}
              <div
                style={{
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <button
                  onClick={() => handleToggleActif(p)}
                  disabled={isBusy}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: p.actif ? '#dcfce7' : '#fee2e2',
                    color: p.actif ? '#15803d' : '#b91c1c',
                  }}
                >
                  {p.actif ? <Eye size={13} /> : <EyeOff size={13} />}
                  {p.actif ? 'Actif & Visible' : 'Masqué'}
                </button>

                <div style={{ display: 'inline-flex', gap: 6 }}>
                  <button
                    onClick={() => openEdit(p)}
                    title="Modifier ce plan"
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      padding: '6px 10px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Edit3 size={14} /> Modifier
                  </button>

                  {p.slug !== 'gratuit' && (
                    <button
                      onClick={() => handleDelete(p)}
                      title="Supprimer ou Désactiver"
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        padding: '6px',
                        cursor: 'pointer',
                        color: '#dc2626',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Création / Édition Plan */}
      {showModal && (
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
              maxWidth: 580,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
              {editingPlan ? `✏️ Modifier le plan "${editingPlan.label}"` : '✨ Créer un nouveau plan tarifaire'}
            </h2>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Nom du Forfait
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Boutique Pro"
                    value={formLabel}
                    onChange={e => setFormLabel(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Prix mensuel (FCFA)
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrix}
                    onChange={e => setFormPrix(Number(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Badge marketing (optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Recommandé"
                    value={formBadge}
                    onChange={e => setFormBadge(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Identifiant slug (ex: pro)
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingPlan)}
                    placeholder="Ex: pro"
                    value={formSlug}
                    onChange={e => setFormSlug(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontFamily: 'monospace' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Couleur
                  </label>
                  <input
                    type="color"
                    value={formCouleur}
                    onChange={e => setFormCouleur(e.target.value)}
                    style={{ width: '100%', height: 38, padding: 2, border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Description commerciale
                </label>
                <textarea
                  rows={2}
                  placeholder="Expliquez la cible et les atouts de cette formule..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, resize: 'none' }}
                />
              </div>

              {/* Limites Produits & Caissiers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Max Produits
                  </label>
                  <input
                    type="number"
                    value={formMaxProduits}
                    onChange={e => setFormMaxProduits(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Max Caissiers POS
                  </label>
                  <input
                    type="number"
                    value={formMaxCaissiers}
                    onChange={e => setFormMaxCaissiers(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formOrdre}
                    onChange={e => setFormOrdre(parseInt(e.target.value) || 0)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>
              </div>

              {/* Avantages Inclus */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                  Points forts & fonctionnalités listées
                </label>

                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input
                    type="text"
                    placeholder="Ajouter un avantage (ex: 🎁 1er mois 100% OFFERT)..."
                    value={newAvantageText}
                    onChange={e => setNewAvantageText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAvantage() } }}
                    style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                  <button
                    type="button"
                    onClick={addAvantage}
                    style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Ajouter
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto', background: '#f8fafc', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  {formAvantages.map((av, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                      <span>{av}</span>
                      <button
                        type="button"
                        onClick={() => removeAvantage(idx)}
                        style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formActif}
                    onChange={e => setFormActif(e.target.checked)}
                  />
                  Plan actif et souscriptible
                </label>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {editingPlan ? 'Mettre à jour le Forfait' : 'Créer le Forfait'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
