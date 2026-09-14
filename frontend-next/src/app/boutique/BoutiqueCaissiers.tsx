'use client'

import React, { useState, useEffect } from 'react'
import { useTranslation } from '@/i18n/context'
import { AlertTriangle, Users } from 'lucide-react'
import CaissierTerminalBanner from './caissiers/CaissierTerminalBanner'
import CaissierAddForm from './caissiers/CaissierAddForm'
import CaissierCardItem, { type Caissier } from './caissiers/CaissierCardItem'

const CODES_PIN_TRIVIAUX = [
  '1234',
  '0000',
  '9999',
  '1111',
  '2222',
  '3333',
  '4444',
  '5555',
  '6666',
  '7777',
  '8888',
  '1212',
]

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
  const { t } = useTranslation() as { t: any }

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPin, setEditPin] = useState('')
  const [showEditPin, setShowEditPin] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const [caisseToken, setCaisseToken] = useState<string | null>(null)
  const [copie, setCopie] = useState(false)

  async function fetchCaissiers() {
    const cached = localStorage.getItem(`nopalou_offline_caissiers_${boutiqueId}`)
    if (cached) {
      try {
        setCaissiers(JSON.parse(cached))
      } catch (e) {
        console.warn('[Nopalou:BoutiqueCaissiers]', e)
      }
    }
    if (!cached) setLoading(true)

    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers`)
      if (!res.ok) throw new Error(t('errors.genericError') || 'Erreur de chargement')
      const data = await res.json()
      setCaissiers(data.caissiers || [])
      localStorage.setItem(
        `nopalou_offline_caissiers_${boutiqueId}`,
        JSON.stringify(data.caissiers || [])
      )
    } catch (err: any) {
      if (!cached) setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaissiers()
  }, [boutiqueId])

  useEffect(() => {
    if (!boutiqueId) return
    fetch(`/api/boutiques/${boutiqueId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const token = data?.caisse_token || data?.boutique?.caisse_token || boutiqueId
        setCaisseToken(token)
      })
      .catch(() => setCaisseToken(boutiqueId))
  }, [boutiqueId])

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://nopalou.com'
  const activeToken = caisseToken || boutiqueId
  const terminalUrl = `${siteUrl}/boutique/caisse?token=${activeToken}`

  async function handleAddCaissier(e: React.FormEvent) {
    e.preventDefault()
    if (!newNom || !newPin) return
    const pinNettoye = newPin.trim()
    if (!/^\d{4,6}$/.test(pinNettoye)) {
      setError('Le code PIN doit comporter entre 4 et 6 chiffres numériques')
      return
    }
    if (CODES_PIN_TRIVIAUX.includes(pinNettoye)) {
      setError(
        'Code PIN trop simple ou par défaut (évitez 1234, 0000, 9999...). Veuillez choisir un code secret personnalisé.'
      )
      return
    }
    setAdding(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: newNom.trim(),
          prenom: newPrenom.trim(),
          code_pin: pinNettoye,
          role: newRole,
        }),
      })
      const data = await res.json()
      if (!res.ok)
        throw new Error(data.error || t('errors.genericError') || "Erreur lors de l'ajout")
      setNewNom('')
      setNewPrenom('')
      setNewPin('')
      setNewRole('caissier')
      setSuccessMsg('Nouveau caissier ajouté avec succès !')
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
        method: 'DELETE',
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
        body: JSON.stringify({ actif: !caissier.actif }),
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
      setError(
        'Ce code PIN est trop simple ou par défaut (évitez 1234, 0000, 9999...). Veuillez choisir un code secret personnalisé.'
      )
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers/${caissierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_pin: pinNettoye }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('errors.genericError') || 'Erreur lors de la modification')
      }
      setEditingId(null)
      setEditPin('')
      setSuccessMsg('Code PIN mis à jour avec succès !')
      setTimeout(() => setSuccessMsg(null), 4000)
      await fetchCaissiers()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingEdit(false)
    }
  }

  const caissiersAvecPinTrivial = caissiers.filter(
    (c) => c.actif && (!c.code_pin || CODES_PIN_TRIVIAUX.includes(String(c.code_pin).trim()))
  )

  if (loading && caissiers.length === 0)
    return <div style={{ padding: 40, textAlign: 'center' }}>{t('common.loading')}</div>

  return (
    <div
      style={{
        padding: '16px 16px 32px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--navy)',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}
        >
          {t('shop.caissiersTitle')}
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 13.5, margin: 0, lineHeight: 1.5 }}>
          {t('shop.teamDesc')}
        </p>
      </div>

      {/* Alerte Sécurité Codes PIN par défaut */}
      {caissiersAvecPinTrivial.length > 0 && (
        <div
          style={{
            background: '#fff7ed',
            border: '1.5px solid #fed7aa',
            borderLeft: '4px solid #ea580c',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            boxShadow: '0 2px 8px rgba(234, 88, 12, 0.06)',
          }}
        >
          <AlertTriangle size={22} style={{ color: '#ea580c', flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#9a3412' }}>
              Action requise : Personnalisez les codes PIN de votre équipe
            </h4>
            <p style={{ margin: 0, fontSize: 12.5, color: '#c2410c', lineHeight: 1.5 }}>
              {caissiersAvecPinTrivial.length} membre(s) utilise(nt) encore un code d&apos;usine
              par défaut (ex: 1234 ou 0000). Pour accéder à la caisse POS en toute sécurité,
              veuillez modifier ces codes ci-dessous.
            </p>
          </div>
        </div>
      )}

      {/* Bloc Lien Terminal Caissier */}
      <CaissierTerminalBanner
        terminalUrl={terminalUrl}
        copie={copie}
        setCopie={setCopie}
        t={t}
      />

      {error && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            padding: '10px 14px',
            borderRadius: 10,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {successMsg}
        </div>
      )}

      {/* Formulaire d'Ajout de Caissier */}
      <CaissierAddForm
        handleAddCaissier={handleAddCaissier}
        newNom={newNom}
        setNewNom={setNewNom}
        newPrenom={newPrenom}
        setNewPrenom={setNewPrenom}
        newPin={newPin}
        setNewPin={setNewPin}
        showNewPin={showNewPin}
        setShowNewPin={setShowNewPin}
        newRole={newRole}
        setNewRole={setNewRole}
        adding={adding}
        t={t}
      />

      {/* Liste des Caissiers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: 'var(--navy)',
            margin: '0 0 4px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Users size={16} />
          <span>
            {t('shop.registeredCashiersTitle')} ({caissiers.length})
          </span>
        </h3>

        {caissiers.map((caissier) => {
          const isTrivial = CODES_PIN_TRIVIAUX.includes(
            String(caissier.code_pin || '').trim()
          )
          const isEditing = editingId === caissier.id

          return (
            <CaissierCardItem
              key={caissier.id}
              caissier={caissier}
              isTrivial={isTrivial}
              isEditing={isEditing}
              editPin={editPin}
              setEditPin={setEditPin}
              showEditPin={showEditPin}
              setShowEditPin={setShowEditPin}
              savingEdit={savingEdit}
              handleSavePin={handleSavePin}
              onStartEdit={() => {
                setEditingId(caissier.id)
                setEditPin('')
                setShowEditPin(false)
              }}
              onCancelEdit={() => {
                setEditingId(null)
                setEditPin('')
              }}
              handleToggleActif={handleToggleActif}
              handleDelete={handleDelete}
              t={t}
            />
          )
        })}

        {caissiers.length === 0 && !loading && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              color: 'var(--text3)',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid var(--border)',
            }}
          >
            {t('shop.noCashiersFound')}
          </div>
        )}
      </div>
    </div>
  )
}
