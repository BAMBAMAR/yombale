'use client'

import React, { useState, useEffect } from 'react'
import {
  Bell,
  Clock,
  Ban,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ShoppingBag,
  BookOpen,
  Sparkles,
  VolumeX,
  Smartphone
} from 'lucide-react'
import { useToast } from '@/context/ToastContext'
import type { Boutique } from './types'

interface PreferencesNotif {
  notif_bilan_caisse: boolean
  notif_heure_bilan: number
  notif_relance_dettes: boolean
  notif_panier_abandonne: boolean
  notif_marketing_astuces: boolean
  relances_suspendues: boolean
  est_blackliste_whatsapp: boolean
}

export default function ParametresNotifications({
  boutique,
  onUpdate
}: {
  boutique: Boutique
  onUpdate?: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<PreferencesNotif>({
    notif_bilan_caisse: true,
    notif_heure_bilan: 21,
    notif_relance_dettes: false,
    notif_panier_abandonne: true,
    notif_marketing_astuces: false,
    relances_suspendues: false,
    est_blackliste_whatsapp: false
  })

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || ''

  useEffect(() => {
    let active = true
    async function loadPrefs() {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('nopalou_token') || ''
        const res = await fetch(`${backendUrl}/api/boutiques/${boutique.id}/preferences-notifications`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) throw new Error('Impossible de charger vos préférences')
        const data = await res.json()
        if (active && data.preferences) {
          setPrefs({
            notif_bilan_caisse: Boolean(data.preferences.notif_bilan_caisse),
            notif_heure_bilan: Number(data.preferences.notif_heure_bilan) || 21,
            notif_relance_dettes: Boolean(data.preferences.notif_relance_dettes),
            notif_panier_abandonne: Boolean(data.preferences.notif_panier_abandonne),
            notif_marketing_astuces: Boolean(data.preferences.notif_marketing_astuces),
            relances_suspendues: Boolean(data.preferences.relances_suspendues),
            est_blackliste_whatsapp: Boolean(data.preferences.est_blackliste_whatsapp)
          })
        }
      } catch (err: any) {
        console.warn('[NOTIF PREFS LOAD ERR]', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadPrefs()
    return () => { active = false }
  }, [backendUrl, boutique.id])

  const handleToggle = async (key: keyof PreferencesNotif, value: any) => {
    const updated = { ...prefs, [key]: value }
    setPrefs(updated)
    setSaving(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('nopalou_token') || ''
      const res = await fetch(`${backendUrl}/api/boutiques/${boutique.id}/preferences-notifications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ [key]: value })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la mise à jour')
      toast({ type: 'success', message: 'Préférence enregistrée.' })
      if (onUpdate) onUpdate()
    } catch (err: any) {
      toast({ type: 'error', message: err.message })
      // Revert en cas d'échec
      setPrefs(prefs)
    } finally {
      setSaving(false)
    }
  }

  const handleStopperTout = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('nopalou_token') || ''
      const res = await fetch(`${backendUrl}/api/boutiques/${boutique.id}/preferences-notifications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ stopper_tout_whatsapp: true })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la désactivation')
      setPrefs(prev => ({
        ...prev,
        relances_suspendues: true,
        notif_bilan_caisse: false,
        notif_relance_dettes: false,
        notif_panier_abandonne: false,
        notif_marketing_astuces: false,
        est_blackliste_whatsapp: true
      }))
      toast({ type: 'success', message: 'Toutes les notifications WhatsApp ont été arrêtées.' })
      if (onUpdate) onUpdate()
    } catch (err: any) {
      toast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleReactiver = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('nopalou_token') || ''
      const res = await fetch(`${backendUrl}/api/boutiques/${boutique.id}/preferences-notifications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          relances_suspendues: false,
          notif_bilan_caisse: true,
          notif_panier_abandonne: true
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la réactivation')
      setPrefs(prev => ({
        ...prev,
        relances_suspendues: false,
        notif_bilan_caisse: true,
        notif_panier_abandonne: true,
        est_blackliste_whatsapp: false
      }))
      toast({ type: 'success', message: 'Notifications réactivées avec succès.' })
      if (onUpdate) onUpdate()
    } catch (err: any) {
      toast({ type: 'error', message: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent, #C75B00)', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--navy, #1C2B4A)', fontSize: 14 }}>Chargement de vos préférences...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* En-tête */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 12,
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'rgba(199, 91, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent, #C75B00)'
          }}>
            <Bell size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--navy, #1C2B4A)', margin: 0 }}>
              Préférences de Notifications WhatsApp
            </h2>
            <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
              Vous gardez le contrôle total : activez uniquement les alertes utiles à votre activité.
            </p>
          </div>
        </div>

        {/* Bannière de statut */}
        {prefs.relances_suspendues || prefs.est_blackliste_whatsapp ? (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 8,
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <VolumeX size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
                  Toutes les notifications WhatsApp sont actuellement suspendues
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#B91C1C' }}>
                  Aucun message automatique ne sera envoyé sur votre numéro.
                </p>
              </div>
            </div>
            <button
              onClick={handleReactiver}
              disabled={saving}
              className="btn-npl"
              style={{
                fontSize: 12,
                padding: '6px 14px',
                background: '#fff',
                color: '#991B1B',
                border: '1px solid #F87171',
                borderRadius: 6,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Réactiver
            </button>
          </div>
        ) : (
          <div style={{
            marginTop: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(10, 92, 54, 0.08)',
            border: '1px solid rgba(10, 92, 54, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <ShieldCheck size={16} style={{ color: 'var(--price, #0A5C36)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--price, #0A5C36)', fontWeight: 500 }}>
              Garde-fous actifs : Maximum 1 message par jour ouvré (09h00 - 20h30). Zéro spam.
            </span>
          </div>
        )}
      </div>

      {/* Liste des commutateurs */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border, #E8DDD2)',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {/* 1. Bilan quotidien caisse POS */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ marginTop: 2, color: 'var(--accent, #C75B00)' }}><Clock size={18} /></div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                Bilan quotidien de ma Caisse POS
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B' }}>
                Recevoir le total des encaissements (Wave, espèces, OM) à la clôture de journée.
              </p>
              {prefs.notif_bilan_caisse && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748B' }}>Heure de réception :</span>
                  <select
                    value={prefs.notif_heure_bilan}
                    onChange={(e) => handleToggle('notif_heure_bilan', Number(e.target.value))}
                    disabled={saving}
                    style={{
                      fontSize: 12,
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: '1px solid var(--border, #E8DDD2)',
                      background: '#fff',
                      color: 'var(--navy, #1C2B4A)'
                    }}
                  >
                    <option value={19}>19h00</option>
                    <option value={20}>20h00</option>
                    <option value={21}>21h00 (Recommandé)</option>
                    <option value={22}>22h00</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <input
            type="checkbox"
            checked={prefs.notif_bilan_caisse && !prefs.relances_suspendues}
            disabled={saving || prefs.relances_suspendues}
            onChange={(e) => handleToggle('notif_bilan_caisse', e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent, #C75B00)' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #F1E9DF', margin: 0 }} />

        {/* 2. Relances automatiques carnet de dettes */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ marginTop: 2, color: 'var(--price, #0A5C36)' }}><BookOpen size={18} /></div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                Rappels automatiques du Carnet de Dettes
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B' }}>
                Autoriser Nopalou à envoyer un rappel courtois sur WhatsApp aux clients dont l'échéance de crédit est dépassée.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={prefs.notif_relance_dettes && !prefs.relances_suspendues}
            disabled={saving || prefs.relances_suspendues}
            onChange={(e) => handleToggle('notif_relance_dettes', e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--price, #0A5C36)' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #F1E9DF', margin: 0 }} />

        {/* 3. Alertes paniers abandonnés */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ marginTop: 2, color: 'var(--navy, #1C2B4A)' }}><ShoppingBag size={18} /></div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                Relance de Panier Abandonné en Ligne
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B' }}>
                Envoyer au client ayant initié une commande non réglée un lien direct pour finaliser en 1 clic par Wave.
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={prefs.notif_panier_abandonne && !prefs.relances_suspendues}
            disabled={saving || prefs.relances_suspendues}
            onChange={(e) => handleToggle('notif_panier_abandonne', e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent, #C75B00)' }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #F1E9DF', margin: 0 }} />

        {/* 4. Astuces marketing & nouveautés */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ marginTop: 2, color: '#D97706' }}><Sparkles size={18} /></div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--navy, #1C2B4A)' }}>
                Conseils, Astuces et Nouveautés Produits
              </p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B' }}>
                Recevoir des astuces d'optimisation de vos ventes et les guides d'onboarding sur WhatsApp (max 1/semaine).
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={prefs.notif_marketing_astuces && !prefs.relances_suspendues}
            disabled={saving || prefs.relances_suspendues}
            onChange={(e) => handleToggle('notif_marketing_astuces', e.target.checked)}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#D97706' }}
          />
        </div>
      </div>

      {/* Zone de désactivation d'urgence / Droit au silence */}
      <div style={{
        background: '#fff',
        border: '1px solid #FEE2E2',
        borderRadius: 12,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ban size={18} style={{ color: '#DC2626' }} />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#991B1B', margin: 0 }}>
            Droit au Silence & Arrêt Total
          </h3>
        </div>
        <p style={{ fontSize: 12, color: '#7F1D1D', margin: 0, lineHeight: 1.5 }}>
          Vous ne souhaitez recevoir aucun message WhatsApp de la plateforme ? Cliquez ci-dessous pour couper immédiatement toutes les notifications. Votre boutique, vos ventes et votre caisse restent 100% fonctionnelles.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <button
            onClick={handleStopperTout}
            disabled={saving || prefs.relances_suspendues}
            className="btn-npl"
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              background: prefs.relances_suspendues ? '#F3F4F6' : '#DC2626',
              color: prefs.relances_suspendues ? '#9CA3AF' : '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: prefs.relances_suspendues ? 'not-allowed' : 'pointer'
            }}
          >
            {prefs.relances_suspendues ? 'Notifications déjà suspendues' : 'Stopper toutes les notifications WhatsApp'}
          </button>
          <span style={{ fontSize: 11, color: '#9CA3AF' }}>
            Ou répondez simplement <strong>STOP</strong> sur WhatsApp
          </span>
        </div>
      </div>
    </div>
  )
}
