'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Building2, Store, Crown, Sparkles } from 'lucide-react'

export interface Plan {
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
  categorie?: 'boutique' | 'immo' | string
}

interface AdminPlanModalProps {
  isOpen: boolean
  onClose: () => void
  editingPlan: Plan | null
  defaultCategorie?: 'boutique' | 'immo'
  secret: string
  onSaved: (plan: Plan, isEdit: boolean) => void
  showToast: (type: 'ok' | 'err', text: string) => void
  nextOrdre: number
}

export default function AdminPlanModal({
  isOpen,
  onClose,
  editingPlan,
  defaultCategorie = 'boutique',
  secret,
  onSaved,
  showToast,
  nextOrdre,
}: AdminPlanModalProps) {
  const [formCategorie, setFormCategorie] = useState<'boutique' | 'immo'>(defaultCategorie)
  const [formSlug, setFormSlug] = useState('')
  const [formLabel, setFormLabel] = useState('')
  const [formPrix, setFormPrix] = useState(0)
  const [formBadge, setFormBadge] = useState('')
  const [formCouleur, setFormCouleur] = useState('#0284c7')
  const [formDescription, setFormDescription] = useState('')
  const [formOrdre, setFormOrdre] = useState(nextOrdre)
  const [formActif, setFormActif] = useState(true)

  // Limites Boutique
  const [formMaxProduits, setFormMaxProduits] = useState(100)
  const [formMaxCaissiers, setFormMaxCaissiers] = useState(1)

  // Limites Immo
  const [formMaxBiens, setFormMaxBiens] = useState(-1)
  const [formMaxAgents, setFormMaxAgents] = useState(5)
  const [formBauxOhada, setFormBauxOhada] = useState(true)
  const [formExportCompta, setFormExportCompta] = useState(false)
  const [formMultiAgences, setFormMultiAgences] = useState(false)
  const [formBadgeSponsoring, setFormBadgeSponsoring] = useState(false)

  // Avantages
  const [formAvantages, setFormAvantages] = useState<string[]>([])
  const [newAvantageText, setNewAvantageText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editingPlan) {
      setFormCategorie((editingPlan.categorie === 'immo' ? 'immo' : 'boutique'))
      setFormSlug(editingPlan.slug)
      setFormLabel(editingPlan.label)
      setFormPrix(editingPlan.prix_mensuel || 0)
      setFormBadge(editingPlan.badge || '')
      setFormCouleur(editingPlan.couleur || (editingPlan.categorie === 'immo' ? '#8b5cf6' : '#0284c7'))
      setFormDescription(editingPlan.description || '')
      setFormOrdre(editingPlan.ordre || 0)
      setFormActif(editingPlan.actif !== false)

      const lim = editingPlan.limites || {}
      setFormMaxProduits(lim.max_produits !== undefined ? lim.max_produits : 100)
      setFormMaxCaissiers(lim.max_caissiers !== undefined ? lim.max_caissiers : 1)

      setFormMaxBiens(lim.max_biens !== undefined ? lim.max_biens : -1)
      setFormMaxAgents(lim.max_agents !== undefined ? lim.max_agents : 5)
      setFormBauxOhada(lim.baux_ohada !== false)
      setFormExportCompta(Boolean(lim.export_compta))
      setFormMultiAgences(Boolean(lim.multi_agences))
      setFormBadgeSponsoring(Boolean(lim.badge_sponsoring))

      setFormAvantages(Array.isArray(editingPlan.avantages) ? [...editingPlan.avantages] : [])
    } else {
      setFormCategorie(defaultCategorie)
      setFormSlug('')
      setFormLabel('')
      setFormPrix(defaultCategorie === 'immo' ? 10000 : 5000)
      setFormBadge(defaultCategorie === 'immo' ? 'Pro' : 'Populaire')
      setFormCouleur(defaultCategorie === 'immo' ? '#8b5cf6' : '#0284c7')
      setFormDescription('')
      setFormOrdre(nextOrdre)
      setFormActif(true)
      setFormMaxProduits(100)
      setFormMaxCaissiers(1)
      setFormMaxBiens(-1)
      setFormMaxAgents(5)
      setFormBauxOhada(true)
      setFormExportCompta(false)
      setFormMultiAgences(false)
      setFormBadgeSponsoring(false)
      setFormAvantages(
        defaultCategorie === 'immo'
          ? ['Mandats & Biens en ligne illimités', 'Gestion baux OHADA et quittances', 'Jusqu\'à 5 agents négociateurs']
          : ['Accès caisse & boutique en ligne', 'Support client dédié']
      )
    }
  }, [editingPlan, defaultCategorie, nextOrdre, isOpen])

  if (!isOpen) return null

  const addAvantage = () => {
    if (!newAvantageText.trim()) return
    setFormAvantages(prev => [...prev, newAvantageText.trim()])
    setNewAvantageText('')
  }

  const removeAvantage = (index: number) => {
    setFormAvantages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formLabel.trim()) return

    setIsSubmitting(true)
    const isEdit = Boolean(editingPlan)
    const url = isEdit ? `/api/plans/admin/${editingPlan!.id}` : '/api/plans/admin'
    const method = isEdit ? 'PUT' : 'POST'

    const limitesPayload =
      formCategorie === 'immo'
        ? {
            max_biens: formMaxBiens,
            max_agents: formMaxAgents,
            baux_ohada: formBauxOhada,
            export_compta: formExportCompta,
            multi_agences: formMultiAgences,
            badge_sponsoring: formBadgeSponsoring,
          }
        : {
            max_produits: formMaxProduits,
            max_caissiers: formMaxCaissiers,
          }

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
          categorie: formCategorie,
          avantages: formAvantages,
          limites: limitesPayload,
        }),
      })

      const data = await res.json()
      if (res.ok && data.plan) {
        onSaved(data.plan, isEdit)
        showToast('ok', `Forfait "${formLabel}" ${isEdit ? 'mis à jour' : 'créé avec succès'} !`)
        onClose()
      } else {
        showToast('err', data.error || 'Erreur lors de l\'enregistrement')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur réseau')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: 16,
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: 24,
          maxWidth: 620,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          border: '1px solid var(--border, #E8DDD2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--navy, #1C2B4A)' }}>
            {editingPlan ? `Modifier le plan "${editingPlan.label}"` : 'Créer un nouveau forfait'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          {/* Sélecteur de Catégorie Métier */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--navy, #1C2B4A)', marginBottom: 6 }}>
              Segment & Type d&apos;activité
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button
                type="button"
                onClick={() => setFormCategorie('boutique')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `2px solid ${formCategorie === 'boutique' ? '#0284c7' : '#e2e8f0'}`,
                  background: formCategorie === 'boutique' ? '#f0f9ff' : '#ffffff',
                  color: formCategorie === 'boutique' ? '#0369a1' : '#64748b',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Store size={16} />
                <span>Boutique & Point de Vente</span>
              </button>

              <button
                type="button"
                onClick={() => setFormCategorie('immo')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: `2px solid ${formCategorie === 'immo' ? '#8b5cf6' : '#e2e8f0'}`,
                  background: formCategorie === 'immo' ? '#f5f3ff' : '#ffffff',
                  color: formCategorie === 'immo' ? '#6d28d9' : '#64748b',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Building2 size={16} />
                <span>Agence Immobilière</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                Nom public de la formule
              </label>
              <input
                type="text"
                required
                placeholder={formCategorie === 'immo' ? 'Ex: Plan Agence Pro' : 'Ex: Boutique Pro'}
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
                min={0}
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
                Identifiant slug
              </label>
              <input
                type="text"
                disabled={Boolean(editingPlan)}
                placeholder={formCategorie === 'immo' ? 'ex: immo_croissance' : 'ex: boutique_pro'}
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

          {/* Limites Spécifiques selon Catégorie */}
          {formCategorie === 'boutique' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Max Produits
                </label>
                <input
                  type="number"
                  value={formMaxProduits}
                  onChange={e => setFormMaxProduits(parseInt(e.target.value, 10) || 0)}
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
                  onChange={e => setFormMaxCaissiers(parseInt(e.target.value, 10) || 1)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Ordre d&apos;affichage
                </label>
                <input
                  type="number"
                  value={formOrdre}
                  onChange={e => setFormOrdre(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6 }}
                />
              </div>
            </div>
          ) : (
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 10 }}>
                Paramètres & Quotas Pôle Immobilier
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Max Biens (-1 = illimité)
                  </label>
                  <input
                    type="number"
                    value={formMaxBiens}
                    onChange={e => setFormMaxBiens(parseInt(e.target.value, 10) || -1)}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Max Agents (-1 = illimité)
                  </label>
                  <input
                    type="number"
                    value={formMaxAgents}
                    onChange={e => setFormMaxAgents(parseInt(e.target.value, 10) || 1)}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Ordre d&apos;affichage
                  </label>
                  <input
                    type="number"
                    value={formOrdre}
                    onChange={e => setFormOrdre(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formBauxOhada}
                    onChange={e => setFormBauxOhada(e.target.checked)}
                  />
                  Génération baux OHADA & quittances
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formExportCompta}
                    onChange={e => setFormExportCompta(e.target.checked)}
                  />
                  Export comptable & relances
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formMultiAgences}
                    onChange={e => setFormMultiAgences(e.target.checked)}
                  />
                  Option Réseau Multi-Succursales
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formBadgeSponsoring}
                    onChange={e => setFormBadgeSponsoring(e.target.checked)}
                  />
                  Mise en avant Sponsoring Annuaire
                </label>
              </div>
            </div>
          )}

          {/* Avantages Inclus */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
              Points forts & fonctionnalités listées
            </label>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Ajouter un avantage (ex: Contrats certifiés conformes)..."
                value={newAvantageText}
                onChange={e => setNewAvantageText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAvantage()
                  }
                }}
                style={{ flex: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 13 }}
              />
              <button
                type="button"
                onClick={addAvantage}
                style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
              >
                Ajouter
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 130, overflowY: 'auto', background: '#f8fafc', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              {formAvantages.map((av, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                  <span>{av}</span>
                  <button
                    type="button"
                    onClick={() => removeAvantage(idx)}
                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
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
                onClick={onClose}
                disabled={isSubmitting}
                style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: formCategorie === 'immo' ? '#8b5cf6' : '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                {isSubmitting ? 'Enregistrement...' : editingPlan ? 'Mettre à jour le Forfait' : 'Créer le Forfait'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
