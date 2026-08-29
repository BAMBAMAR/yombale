'use client'

import { useState } from 'react'
import { Layers, Plus, Search, CheckCircle2, XCircle, Edit3, Trash2, ArrowUpDown, Eye, EyeOff, Package, FileText } from 'lucide-react'

interface Categorie {
  id: string
  nom: string
  slug: string
  icone: string
  description?: string | null
  ordre: number
  actif: boolean
  parent_id?: string | null
  nb_produits?: number
  nb_annonces?: number
  created_at?: string
}

export default function AdminCategoriesClient({
  initialCategories,
  secret,
}: {
  initialCategories: Categorie[]
  secret: string
}) {
  const [categories, setCategories] = useState<Categorie[]>(initialCategories)
  const [q, setQ] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCat, setEditingCat] = useState<Categorie | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Formulaire (création ou édition)
  const [formNom, setFormNom] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formIcone, setFormIcone] = useState('📦')
  const [formDesc, setFormDesc] = useState('')
  const [formOrdre, setFormOrdre] = useState(0)
  const [formActif, setFormActif] = useState(true)

  const showToast = (type: 'ok' | 'err', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4500)
  }

  const openCreate = () => {
    setEditingCat(null)
    setFormNom('')
    setFormSlug('')
    setFormIcone('📦')
    setFormDesc('')
    setFormOrdre(categories.length)
    setFormActif(true)
    setShowModal(true)
  }

  const openEdit = (cat: Categorie) => {
    setEditingCat(cat)
    setFormNom(cat.nom)
    setFormSlug(cat.slug)
    setFormIcone(cat.icone || '📦')
    setFormDesc(cat.description || '')
    setFormOrdre(cat.ordre || 0)
    setFormActif(cat.actif !== false)
    setShowModal(true)
  }

  // Filtrage
  const filtered = categories.filter(c => {
    const term = q.trim().toLowerCase()
    return !term || c.nom.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term)
  })

  // Sauvegarde (Création / Mise à jour)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNom.trim()) return

    const isEdit = Boolean(editingCat)
    const url = isEdit ? `/api/categories/admin/${editingCat!.id}` : '/api/categories/admin'
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({
          nom: formNom,
          slug: formSlug,
          icone: formIcone,
          description: formDesc,
          ordre: formOrdre,
          actif: formActif,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        if (isEdit) {
          setCategories(prev => prev.map(c => (c.id === editingCat!.id ? { ...c, ...data.categorie } : c)))
          showToast('ok', `Catégorie "${formNom}" mise à jour !`)
        } else {
          setCategories(prev => [...prev, data.categorie])
          showToast('ok', `Catégorie "${formNom}" créée avec succès !`)
        }
        setShowModal(false)
      } else {
        showToast('err', data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur de connexion')
    }
  }

  // Toggle Actif / Inactif
  const handleToggleActif = async (cat: Categorie) => {
    const nextState = !cat.actif
    setLoadingId(cat.id)

    try {
      const res = await fetch(`/api/categories/admin/${cat.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({ actif: nextState }),
      })

      if (res.ok) {
        setCategories(prev => prev.map(c => (c.id === cat.id ? { ...c, actif: nextState } : c)))
        showToast('ok', `Catégorie "${cat.nom}" ${nextState ? 'activée' : 'masquée'}.`)
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
  const handleDelete = async (cat: Categorie) => {
    if (!confirm(`Supprimer ou désactiver la catégorie "${cat.nom}" ?`)) return
    setLoadingId(cat.id)

    try {
      const res = await fetch(`/api/categories/admin/${cat.id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Secret': secret },
      })

      const data = await res.json()
      if (res.ok) {
        if (data.desactivee) {
          setCategories(prev => prev.map(c => (c.id === cat.id ? { ...c, actif: false } : c)))
          showToast('ok', data.message)
        } else {
          setCategories(prev => prev.filter(c => c.id !== cat.id))
          showToast('ok', `Catégorie "${cat.nom}" définitivement supprimée.`)
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
            📁 Catégories du Catalogue
            <span className="admin-page-count">{categories.length}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Gérez les catégories de produits et d'annonces affichées sur Nopalou, leurs icônes et leur ordre d'apparition.
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
          <Plus size={16} /> Ajouter une Catégorie
        </button>
      </div>

      {/* Barre de Recherche */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #e2e8f0', marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Rechercher une catégorie par nom ou slug (ex: Smartphones, mode...)"
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
      </div>

      {/* Tableau des Catégories */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600, fontSize: 13 }}>
              <th style={{ padding: '12px 16px', width: 60 }}>Ordre</th>
              <th style={{ padding: '12px 16px', width: 60 }}>Icône</th>
              <th style={{ padding: '12px 16px' }}>Nom & Slug</th>
              <th style={{ padding: '12px 16px', width: 140 }}>Produits</th>
              <th style={{ padding: '12px 16px', width: 140 }}>Annonces</th>
              <th style={{ padding: '12px 16px', width: 100 }}>Statut</th>
              <th style={{ padding: '12px 16px', width: 120, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(cat => {
              const isBusy = loadingId === cat.id

              return (
                <tr
                  key={cat.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    opacity: cat.actif === false ? 0.6 : 1,
                    background: cat.actif === false ? '#fafafa' : '#fff',
                  }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#94a3b8' }}>
                    #{cat.ordre ?? 0}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 22 }}>
                    {cat.icone || '📦'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{cat.nom}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{cat.slug}</div>
                    {cat.description && (
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{cat.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                      <Package size={13} /> {cat.nb_produits || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                      <FileText size={13} /> {cat.nb_annonces || 0}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => handleToggleActif(cat)}
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
                        background: cat.actif !== false ? '#dcfce7' : '#fee2e2',
                        color: cat.actif !== false ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {cat.actif !== false ? <Eye size={13} /> : <EyeOff size={13} />}
                      {cat.actif !== false ? 'Visible' : 'Masquée'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        onClick={() => openEdit(cat)}
                        title="Modifier"
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: 6,
                          padding: '6px',
                          cursor: 'pointer',
                          color: '#475569',
                        }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        title="Supprimer / Désactiver"
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
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Création / Modification */}
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
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
              {editingCat ? `✏️ Modifier "${editingCat.nom}"` : '✨ Nouvelle Catégorie'}
            </h2>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Icône
                  </label>
                  <input
                    type="text"
                    required
                    value={formIcone}
                    onChange={e => setFormIcone(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 18, textAlign: 'center' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Électroménager"
                    value={formNom}
                    onChange={e => setFormNom(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Slug URL (optionnel — généré automatiquement si vide)
                </label>
                <input
                  type="text"
                  placeholder="Ex: electromenager"
                  value={formSlug}
                  onChange={e => setFormSlug(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Description (SEO & affichage)
                </label>
                <textarea
                  rows={2}
                  placeholder="Description courte de la catégorie..."
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
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

                <div style={{ display: 'flex', alignItems: 'center', paddingTop: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formActif}
                      onChange={e => setFormActif(e.target.checked)}
                    />
                    Catégorie active & visible
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                    background: '#0284c7',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {editingCat ? 'Mettre à jour' : 'Créer la Catégorie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
