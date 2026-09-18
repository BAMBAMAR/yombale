'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Crown,
  Plus,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Users,
  Check,
  Eye,
  EyeOff,
  Building2,
  Store,
  Sparkles,
  Layers,
  FileCheck2,
  Network,
} from 'lucide-react'
import { fcfa } from '@/lib/format'
import AdminPlanModal, { Plan } from './components/AdminPlanModal'

interface AdminPlansClientProps {
  initialPlans: Plan[]
  secret: string
}

function PlansContent({ initialPlans, secret }: AdminPlansClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialCategoryParam = searchParams.get('categorie') === 'immo' ? 'immo' : searchParams.get('categorie') === 'boutique' ? 'boutique' : 'tous'

  const [activeTab, setActiveTab] = useState<'tous' | 'boutique' | 'immo'>(initialCategoryParam)
  const [plans, setPlans] = useState<Plan[]>(initialPlans)
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const showToast = (type: 'ok' | 'err', text: string) => {
    setNotification({ type, text })
    setTimeout(() => setNotification(null), 4500)
  }

  const boutiquePlans = plans.filter(p => p.categorie !== 'immo')
  const immoPlans = plans.filter(p => p.categorie === 'immo')

  const displayedPlans = activeTab === 'tous'
    ? plans
    : activeTab === 'immo'
    ? immoPlans
    : boutiquePlans

  const handleTabChange = (tab: 'tous' | 'boutique' | 'immo') => {
    setActiveTab(tab)
    if (tab === 'immo') {
      router.replace('/admin/plans?categorie=immo')
    } else if (tab === 'boutique') {
      router.replace('/admin/plans?categorie=boutique')
    } else {
      router.replace('/admin/plans')
    }
  }

  const openCreate = () => {
    setEditingPlan(null)
    setShowModal(true)
  }

  const openEdit = (p: Plan) => {
    setEditingPlan(p)
    setShowModal(true)
  }

  const handleSavedPlan = (savedPlan: Plan, isEdit: boolean) => {
    if (isEdit) {
      setPlans(prev => prev.map(p => (p.id === savedPlan.id ? { ...p, ...savedPlan } : p)))
    } else {
      setPlans(prev => [...prev, savedPlan])
    }
  }

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
        showToast('ok', `Forfait "${p.label}" ${nextState ? 'activé et visible' : 'masqué'}.`)
      } else {
        const d = await res.json()
        showToast('err', d.error || 'Erreur lors de la mise à jour')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Erreur de connexion')
    } finally {
      setLoadingId(null)
    }
  }

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
    <div style={{ maxWidth: 1160, margin: '0 auto', paddingBottom: 60 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h1 className="admin-page-titre" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>Plans Tarifaires & Formules</span>
            <span className="admin-page-count">{plans.length}</span>
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Configuration centrale des offres d&apos;abonnement pour les commerces de détail et les agences immobilières.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="btn-npl"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: activeTab === 'immo' ? '#8b5cf6' : '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          <span>{activeTab === 'immo' ? 'Créer un Forfait Agence' : 'Créer un Forfait'}</span>
        </button>
      </div>

      {/* Barre d'onglets de filtrage */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: '#f1f5f9',
          padding: 4,
          borderRadius: 10,
          width: 'fit-content',
          marginBottom: 24,
          border: '1px solid #e2e8f0',
        }}
      >
        <button
          type="button"
          onClick={() => handleTabChange('tous')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'tous' ? '#ffffff' : 'transparent',
            color: activeTab === 'tous' ? 'var(--navy, #1C2B4A)' : '#64748b',
            boxShadow: activeTab === 'tous' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <Layers size={15} />
          <span>Toutes les formules</span>
          <span style={{ fontSize: 11, background: '#e2e8f0', padding: '1px 6px', borderRadius: 10 }}>
            {plans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('boutique')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'boutique' ? '#ffffff' : 'transparent',
            color: activeTab === 'boutique' ? '#0369a1' : '#64748b',
            boxShadow: activeTab === 'boutique' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <Store size={15} />
          <span>Boutiques & POS</span>
          <span style={{ fontSize: 11, background: activeTab === 'boutique' ? '#e0f2fe' : '#e2e8f0', color: activeTab === 'boutique' ? '#0369a1' : '#64748b', padding: '1px 6px', borderRadius: 10 }}>
            {boutiquePlans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('immo')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            background: activeTab === 'immo' ? '#ffffff' : 'transparent',
            color: activeTab === 'immo' ? '#6d28d9' : '#64748b',
            boxShadow: activeTab === 'immo' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          <Building2 size={15} />
          <span>Agences Immobilières</span>
          <span style={{ fontSize: 11, background: activeTab === 'immo' ? '#ede9fe' : '#e2e8f0', color: activeTab === 'immo' ? '#6d28d9' : '#64748b', padding: '1px 6px', borderRadius: 10 }}>
            {immoPlans.length}
          </span>
        </button>
      </div>

      {/* Grille des Plans */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {displayedPlans.map(p => {
          const isBusy = loadingId === p.id
          const isImmo = p.categorie === 'immo'
          const planColor = p.couleur || (isImmo ? '#8b5cf6' : '#0284c7')

          return (
            <div
              key={p.slug}
              style={{
                background: '#fff',
                borderRadius: 14,
                border: `2px solid ${p.actif ? planColor : '#e2e8f0'}`,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
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
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: isImmo ? '#f5f3ff' : '#f0f9ff',
                          color: isImmo ? '#7c3aed' : '#0284c7',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isImmo ? <Building2 size={11} /> : <Store size={11} />}
                        {isImmo ? 'Agence Immo' : 'Boutique'}
                      </span>
                    </div>
                    <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#1e293b' }}>
                      {p.label}
                    </h3>
                  </div>

                  {p.badge && (
                    <span
                      style={{
                        backgroundColor: planColor,
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      {p.badge.toLowerCase().includes('vedette') || p.badge.toLowerCase().includes('pro') ? (
                        <Sparkles size={11} />
                      ) : (
                        <Crown size={11} />
                      )}
                      {p.badge}
                    </span>
                  )}
                </div>

                {/* Prix */}
                <div style={{ margin: '12px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#1e293b' }}>
                    {p.prix_mensuel === 0 ? 'GRATUIT' : fcfa(p.prix_mensuel)}
                    {p.prix_mensuel > 0 && <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}> / mois</span>}
                  </div>
                  {p.description && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>
                      {p.description}
                    </p>
                  )}
                </div>

                {/* Limites & Abonnés actifs */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {isImmo ? (
                    <>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                        Biens: {p.limites?.max_biens === -1 || !p.limites?.max_biens ? 'Illimité' : p.limites.max_biens}
                      </span>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                        Agents: {p.limites?.max_agents === -1 || !p.limites?.max_agents ? 'Illimité' : p.limites.max_agents}
                      </span>
                      {p.limites?.baux_ohada && (
                        <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <FileCheck2 size={12} color="#8b5cf6" /> Baux OHADA
                        </span>
                      )}
                      {p.limites?.multi_agences && (
                        <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Network size={12} color="#8b5cf6" /> Multi-Agences
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                        Max: {p.limites?.max_produits || 'Illimité'} produits
                      </span>
                      <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
                        Max: {p.limites?.max_caissiers || 1} caissier(s)
                      </span>
                    </>
                  )}

                  {p.nb_abonnes_actifs !== undefined && (
                    <span style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700, color: '#047857', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Users size={12} />
                      {p.nb_abonnes_actifs} abonné(s)
                    </span>
                  )}
                </div>

                {/* Liste des Avantages */}
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Avantages inclus :
                  </span>
                  <ul style={{ margin: '8px 0 0', paddingLeft: 0, listStyle: 'none' }}>
                    {p.avantages?.map((av, idx) => (
                      <li key={idx} style={{ fontSize: 13, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                        <Check size={14} color={planColor} style={{ flexShrink: 0, marginTop: 2 }} />
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
                  type="button"
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
                    type="button"
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

                  {p.slug !== 'gratuit' && p.slug !== 'immo_essentiel' && (
                    <button
                      type="button"
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

      {/* Modal Création / Édition Plan Extrait */}
      <AdminPlanModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        editingPlan={editingPlan}
        defaultCategorie={activeTab === 'immo' ? 'immo' : 'boutique'}
        secret={secret}
        onSaved={handleSavedPlan}
        showToast={showToast}
        nextOrdre={plans.length}
      />
    </div>
  )
}

export default function AdminPlansClient(props: AdminPlansClientProps) {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Chargement du catalogue des offres...</div>}>
      <PlansContent {...props} />
    </Suspense>
  )
}
