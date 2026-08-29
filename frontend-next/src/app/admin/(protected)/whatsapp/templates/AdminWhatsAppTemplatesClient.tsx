'use client'

import { useState } from 'react'
import {
  MessageCircle, Edit3, RotateCcw, CheckCircle2, XCircle, Sparkles,
  Layers, Check, Eye, HelpCircle, ArrowRight
} from 'lucide-react'

interface WhatsAppTemplate {
  key: string
  label: string
  categorie: string
  description: string
  variables: string[]
  defaultText: string
  currentText: string
  isCustom: boolean
}

export default function AdminWhatsAppTemplatesClient({
  initialTemplates,
  secret,
}: {
  initialTemplates: WhatsAppTemplate[]
  secret: string
}) {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(initialTemplates)
  const [editingTpl, setEditingTpl] = useState<WhatsAppTemplate | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const showToast = (type: 'ok' | 'err', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4000)
  }

  const openEdit = (tpl: WhatsAppTemplate) => {
    setEditingTpl(tpl)
    setEditText(tpl.currentText)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTpl) return
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/whatsapp-templates/${editingTpl.key}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Secret': secret,
        },
        body: JSON.stringify({ text: editText }),
      })

      if (res.ok) {
        setTemplates(prev =>
          prev.map(t =>
            t.key === editingTpl.key
              ? { ...t, currentText: editText, isCustom: editText !== t.defaultText }
              : t
          )
        )
        showToast('ok', `Template "${editingTpl.label}" mis à jour avec succès !`)
        setEditingTpl(null)
      } else {
        showToast('err', 'Erreur lors de la mise à jour.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async (tpl: WhatsAppTemplate) => {
    if (!confirm(`Réinitialiser le template "${tpl.label}" à sa version par défaut ?`)) return

    try {
      const res = await fetch(`/api/admin/whatsapp-templates/${tpl.key}/reset`, {
        method: 'POST',
        headers: { 'X-Admin-Secret': secret },
      })

      if (res.ok) {
        setTemplates(prev =>
          prev.map(t =>
            t.key === tpl.key
              ? { ...t, currentText: t.defaultText, isCustom: false }
              : t
          )
        )
        showToast('ok', `Template "${tpl.label}" réinitialisé !`)
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur')
    }
  }

  // Simulation de rendu
  const renderPreview = (text: string) => {
    const sampleVars: Record<string, string> = {
      prenom: 'Moussa',
      boutique_nom: 'Dakar High-Tech',
      slug: 'dakar-high-tech',
      lien_boutique: 'https://nopalou.com/boutiques/dakar-high-tech',
      lien_abonnement: 'https://nopalou.com/boutique/abonnement',
      lien_ajout_produit: 'https://nopalou.com/boutique/produits/nouveau',
      client_nom: 'Fatou Sow',
      client_telephone: '+221 77 123 45 67',
      client_adresse: 'Almadies, Dakar',
      montant: '25 000',
      date_echeance: '15/09/2026',
      nom_produit: 'iPhone 13 Pro 128Go',
      quantite: '1',
      boutique_tel: '+221 77 720 20 86',
    }

    let rendered = text
    for (const [k, v] of Object.entries(sampleVars)) {
      const reg = new RegExp(`\\{${k}\\}`, 'g')
      rendered = rendered.replace(reg, v)
    }
    return rendered
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
            💬 Templates des Messages WhatsApp
            <span className="admin-page-count">{templates.length}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Personnalisez les messages d'onboarding, les notifications de commandes et les rappels du carnet de dettes sans modifier le code.
          </p>
        </div>
      </div>

      {/* Grille des Templates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
        {templates.map(tpl => (
          <div
            key={tpl.key}
            style={{
              background: '#fff',
              borderRadius: 14,
              border: tpl.isCustom ? '2px solid #22c55e' : '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
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
                  {tpl.key}
                </span>

                {tpl.isCustom ? (
                  <span style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                    ✨ Personnalisé
                  </span>
                ) : (
                  <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                    Par défaut
                  </span>
                )}
              </div>

              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#1e293b' }}>
                {tpl.label}
              </h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b' }}>
                {tpl.description}
              </p>

              {/* Tags de variables disponibles */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {tpl.variables.map(v => (
                  <span
                    key={v}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 11,
                      fontFamily: 'monospace',
                      color: '#0284c7',
                      fontWeight: 600,
                    }}
                  >
                    {`{${v}}`}
                  </span>
                ))}
              </div>

              {/* Aperçu Texte Actuel */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 12,
                  color: '#334155',
                  lineHeight: 1.45,
                  whiteSpace: 'pre-line',
                  maxHeight: 140,
                  overflowY: 'auto',
                }}
              >
                {tpl.currentText}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
              {tpl.isCustom && (
                <button
                  type="button"
                  onClick={() => handleReset(tpl)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <RotateCcw size={13} /> Réinitialiser
                </button>
              )}

              <button
                type="button"
                onClick={() => openEdit(tpl)}
                style={{
                  background: '#16a34a',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Edit3 size={13} /> Modifier le Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Éditeur de Template avec Simulation */}
      {editingTpl && (
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
              maxWidth: 720,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                  ✏️ Modifier : {editingTpl.label}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
                  Utilisez les balises entre accolades pour injecter automatiquement les données contextuelles.
                </p>
              </div>
              <button
                onClick={() => setEditingTpl(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', alignSelf: 'center' }}>Variables :</span>
                  {editingTpl.variables.map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setEditText(prev => prev + `{${v}}`)}
                      style={{
                        background: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 12,
                        fontFamily: 'monospace',
                        color: '#0369a1',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      + {`{${v}}`}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={6}
                  required
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontSize: 14,
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                    fontFamily: 'sans-serif',
                  }}
                />
              </div>

              {/* Simulation WhatsApp */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: '#15803d', textTransform: 'uppercase', marginBottom: 6 }}>
                  📱 Aperçu en direct dans WhatsApp (Exemple)
                </h3>
                <div
                  style={{
                    background: '#e5ddd5',
                    padding: '14px',
                    borderRadius: 10,
                    maxWidth: 420,
                  }}
                >
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '10px 12px',
                      borderRadius: '8px 8px 8px 0',
                      fontSize: 13,
                      color: '#111827',
                      lineHeight: 1.45,
                      whiteSpace: 'pre-line',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.13)',
                    }}
                  >
                    {renderPreview(editText)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingTpl(null)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  {saving ? 'Enregistrement...' : 'Sauvegarder le Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
