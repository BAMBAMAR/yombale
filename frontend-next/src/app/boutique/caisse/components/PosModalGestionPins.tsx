'use client'

import React, { useState } from 'react'
import { Shield, ShieldAlert, Key, User, Lock, Eye, EyeOff, Save, X, Plus, AlertTriangle, Check } from 'lucide-react'

interface Caissier {
  id: string
  nom: string
  prenom?: string
  role?: string
  code_pin?: string
  actif?: boolean
}

interface Props {
  isOpen: boolean
  isObligatoire?: boolean
  boutiqueId: string
  caissiersList: Caissier[]
  onClose: () => void
  onSuccess?: () => void
  onRefreshCaissiers: () => void
}

export default function PosModalGestionPins({
  isOpen,
  isObligatoire = false,
  boutiqueId,
  caissiersList,
  onClose,
  onSuccess,
  onRefreshCaissiers
}: Props) {
  const [onglet, setOnglet] = useState<'liste' | 'ajouter'>('liste')
  const [editPinsState, setEditPinsState] = useState<{ [caissierId: string]: string }>({})
  const [showPinState, setShowPinState] = useState<{ [caissierId: string]: boolean }>({})
  const [savingPinId, setSavingPinId] = useState<string | null>(null)

  // Champs nouveau caissier
  const [nouveauCaissierNom, setNouveauCaissierNom] = useState('')
  const [nouveauCaissierPrenom, setNouveauCaissierPrenom] = useState('')
  const [nouveauCaissierRole, setNouveauCaissierRole] = useState<'caissier' | 'superviseur'>('caissier')
  const [nouveauCaissierPin, setNouveauCaissierPin] = useState('')
  const [addingState, setAddingState] = useState(false)

  // Config obligatoire
  const [pinObligatoireSuperviseur, setPinObligatoireSuperviseur] = useState('')
  const [pinObligatoireCaissier, setPinObligatoireCaissier] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (!isOpen) return null

  // 1. Sauvegarde de la configuration obligatoire initiale
  async function validerConfigObligatoire() {
    setErreur(null)
    if (!pinObligatoireSuperviseur || pinObligatoireSuperviseur.length < 4) {
      setErreur('Le PIN Superviseur doit comporter entre 4 et 6 chiffres.')
      return
    }
    if (!pinObligatoireCaissier || pinObligatoireCaissier.length < 4) {
      setErreur('Le PIN Caissier doit comporter entre 4 et 6 chiffres.')
      return
    }
    if (['1234', '0000', '1111', '9999'].includes(pinObligatoireSuperviseur)) {
      setErreur('Le PIN Superviseur est trop trivial. Choisissez un code complexe.')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caisse/config-pin-initial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin_superviseur: pinObligatoireSuperviseur,
          pin_caissier: pinObligatoireCaissier
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        onRefreshCaissiers()
        if (onSuccess) onSuccess()
        onClose()
      } else {
        setErreur(data.error || 'Erreur lors de la configuration des PINs.')
      }
    } catch (err: any) {
      setErreur(err.message || 'Erreur réseau lors de la configuration.')
    } finally {
      setSaving(false)
    }
  }

  // 2. Modification inline d'un PIN existant
  async function modifierPin(caissierId: string) {
    const nouveauPin = editPinsState[caissierId]
    if (!nouveauPin || nouveauPin.length < 4) return

    setSavingPinId(caissierId)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers/${caissierId}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_pin: nouveauPin })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setToast({ type: 'success', text: 'Code PIN mis à jour avec succès.' })
        setEditPinsState(prev => {
          const c = { ...prev }
          delete c[caissierId]
          return c
        })
        onRefreshCaissiers()
      } else {
        setToast({ type: 'error', text: data.error || 'Échec de la modification.' })
      }
    } catch {
      setToast({ type: 'error', text: 'Erreur réseau.' })
    } finally {
      setSavingPinId(null)
    }
  }

  // 3. Activer / Désactiver un profil caissier
  async function toggleActif(caissierId: string, actifActuel: boolean) {
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers/${caissierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !actifActuel })
      })
      if (res.ok) onRefreshCaissiers()
    } catch (e) {
      console.error(e)
    }
  }

  // 4. Ajouter un nouveau caissier
  async function creerCaissier() {
    setErreur(null)
    if (!nouveauCaissierNom.trim()) {
      setErreur('Le nom de famille est obligatoire.')
      return
    }
    if (!nouveauCaissierPin || nouveauCaissierPin.length < 4) {
      setErreur('Le code PIN doit comporter 4 à 6 chiffres.')
      return
    }

    setAddingState(true)
    try {
      const res = await fetch(`/api/boutiques/${boutiqueId}/caissiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nouveauCaissierNom.trim(),
          prenom: nouveauCaissierPrenom.trim(),
          role: nouveauCaissierRole,
          code_pin: nouveauCaissierPin
        })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setToast({ type: 'success', text: 'Nouveau profil caissier ajouté.' })
        setNouveauCaissierNom('')
        setNouveauCaissierPrenom('')
        setNouveauCaissierPin('')
        setOnglet('liste')
        onRefreshCaissiers()
      } else {
        setErreur(data.error || 'Impossible d’ajouter ce caissier.')
      }
    } catch {
      setErreur('Erreur réseau.')
    } finally {
      setAddingState(false)
    }
  }

  // ── VUE 1 : Configuration initiale obligatoire ──
  if (isObligatoire) {
    return (
      <div className="pos-modal-backdrop" style={{ zIndex: 12000 }}>
        <div className="pos-modal-card" style={{ maxWidth: 480, border: '2px solid var(--accent, #C75B00)' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--orange2, #FFF3E8)', color: 'var(--accent, #C75B00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Shield size={28} />
          </div>

          <h2 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
            Sécurisation Obligatoire du POS
          </h2>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text2, #5A4E42)', lineHeight: 1.45 }}>
            Pour protéger votre caisse et vos recettes, personnalisez vos <strong>codes PIN secrets</strong> avant de commencer les encaissements.
          </p>

          {erreur && (
            <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, marginBottom: 16, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} />
              <span>{erreur}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24, textAlign: 'left' }}>
            <div style={{ background: 'var(--bg, #F8F5F0)', padding: 14, borderRadius: 12, border: '1px solid var(--border, #E8DDD2)' }}>
              <label style={{ fontSize: 12, color: 'var(--accent, #C75B00)', display: 'block', fontWeight: 800, marginBottom: 4 }}>
                1. Code PIN Gérant / Superviseur (4 à 6 chiffres)
              </label>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 8 }}>
                Autorise les remises, annulations d&apos;articles et clôtures Z.
              </span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={pinObligatoireSuperviseur}
                onChange={e => setPinObligatoireSuperviseur(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--accent, #C75B00)', fontSize: 20, fontWeight: 900, letterSpacing: '0.25em', textAlign: 'center', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ background: 'var(--bg, #F8F5F0)', padding: 14, borderRadius: 12, border: '1px solid var(--border, #E8DDD2)' }}>
              <label style={{ fontSize: 12, color: 'var(--navy, #1C2B4A)', display: 'block', fontWeight: 800, marginBottom: 4 }}>
                2. Code PIN Caissier Standard (4 à 6 chiffres)
              </label>
              <span style={{ fontSize: 11, color: 'var(--text2, #5A4E42)', display: 'block', marginBottom: 8 }}>
                Sert au déverrouillage et à la vente quotidienne.
              </span>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={pinObligatoireCaissier}
                onChange={e => setPinObligatoireCaissier(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 20, fontWeight: 900, letterSpacing: '0.25em', textAlign: 'center', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-npl btn-npl-lg btn-npl-primary"
            onClick={validerConfigObligatoire}
            disabled={saving}
            style={{ width: '100%' }}
          >
            <Lock size={18} />
            <span>{saving ? 'Enregistrement sécurisé...' : 'Activer et Déverrouiller le POS'}</span>
          </button>
        </div>
      </div>
    )
  }

  // ── VUE 2 : Gestion standard des PINs et de l'équipe ──
  return (
    <div className="pos-modal-backdrop" style={{ zIndex: 11000 }}>
      <div className="pos-modal-card" style={{ maxWidth: 540 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'var(--navy, #1C2B4A)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Key size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: 'var(--navy, #1C2B4A)' }}>
                Gestion des Codes PIN &amp; Rôles
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text2, #5A4E42)' }}>
                {caissiersList.length} caissier(s) configuré(s)
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-npl btn-npl-sm btn-npl-ghost">
            <X size={18} />
          </button>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border, #E8DDD2)', paddingBottom: 8 }}>
          <button
            type="button"
            className={`btn-npl btn-npl-sm ${onglet === 'liste' ? 'btn-npl-primary' : 'btn-npl-secondary'}`}
            onClick={() => setOnglet('liste')}
          >
            <span>Équipe &amp; Codes PIN ({caissiersList.length})</span>
          </button>
          <button
            type="button"
            className={`btn-npl btn-npl-sm ${onglet === 'ajouter' ? 'btn-npl-primary' : 'btn-npl-secondary'}`}
            onClick={() => setOnglet('ajouter')}
          >
            <Plus size={14} />
            <span>Nouveau Caissier</span>
          </button>
        </div>

        {toast && (
          <div style={{
            padding: '10px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, marginBottom: 14,
            background: toast.type === 'success' ? '#DCFCE7' : '#FEF2F2',
            color: toast.type === 'success' ? '#166534' : '#991B1B',
            display: 'flex', alignItems: 'center', gap: 6
          }}>
            {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{toast.text}</span>
          </div>
        )}

        {onglet === 'liste' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
            {caissiersList.map(c => {
              const isSuper = c.role === 'superviseur'
              const showPin = showPinState[c.id] || false
              const isEditing = editPinsState[c.id] !== undefined

              return (
                <div key={c.id} style={{
                  background: 'var(--bg, #F8F5F0)',
                  border: '1px solid var(--border, #E8DDD2)',
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 8
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: isSuper ? '#FEF3C7' : '#E0E7FF',
                        color: isSuper ? '#B45309' : '#4338CA',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 12
                      }}>
                        {(c.nom || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--navy, #1C2B4A)' }}>
                            {c.prenom} {c.nom}
                          </span>
                          <span className={`badge-npl ${isSuper ? 'badge-npl-accent' : 'badge-npl-neutral'}`} style={{ fontSize: 10 }}>
                            {isSuper ? 'Superviseur' : 'Caissier'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleActif(c.id, c.actif !== false)}
                      className="btn-npl btn-npl-sm"
                      style={{
                        height: 26, padding: '0 8px', fontSize: 11,
                        background: c.actif !== false ? '#DCFCE7' : '#F1F5F9',
                        color: c.actif !== false ? '#166534' : '#64748B'
                      }}
                    >
                      {c.actif !== false ? 'Actif' : 'Désactivé'}
                    </button>
                  </div>

                  {/* Ligne modification PIN */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border, #E8DDD2)', paddingTop: 8 }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                        <input
                          type={showPin ? 'text' : 'password'}
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="Nouveau PIN"
                          value={editPinsState[c.id]}
                          onChange={e => {
                            const v = e.target.value.replace(/\D/g, '')
                            setEditPinsState(prev => ({ ...prev, [c.id]: v }))
                          }}
                          style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--accent, #C75B00)', fontSize: 13, fontWeight: 800, textAlign: 'center' }}
                        />
                        <button
                          type="button"
                          className="btn-npl btn-npl-sm btn-npl-ghost"
                          onClick={() => setShowPinState(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                        >
                          {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          type="button"
                          className="btn-npl btn-npl-sm btn-npl-primary"
                          onClick={() => modifierPin(c.id)}
                          disabled={savingPinId === c.id || (editPinsState[c.id]?.length || 0) < 4}
                        >
                          <Save size={13} />
                          <span>{savingPinId === c.id ? '...' : 'Valider'}</span>
                        </button>
                        <button
                          type="button"
                          className="btn-npl btn-npl-sm btn-npl-secondary"
                          onClick={() => {
                            setEditPinsState(prev => {
                              const copy = { ...prev }
                              delete copy[c.id]
                              return copy
                            })
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: 'var(--text3, #8C7E74)', fontWeight: 600 }}>PIN :</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--navy, #1C2B4A)', letterSpacing: '0.15em', background: '#FFFFFF', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border, #E8DDD2)' }}>
                            {showPin ? c.code_pin : '••••'}
                          </span>
                          <button
                            type="button"
                            className="btn-npl btn-npl-sm btn-npl-ghost"
                            onClick={() => setShowPinState(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                            style={{ padding: 2, height: 'auto' }}
                          >
                            {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          className="btn-npl btn-npl-sm btn-npl-secondary"
                          onClick={() => setEditPinsState(prev => ({ ...prev, [c.id]: '' }))}
                          style={{ height: 26, fontSize: 11 }}
                        >
                          Modifier le PIN
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Formulaire nouveau caissier */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>Prénom</label>
                <input
                  type="text"
                  placeholder="ex: Aminata"
                  value={nouveauCaissierPrenom}
                  onChange={e => setNouveauCaissierPrenom(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>Nom *</label>
                <input
                  type="text"
                  placeholder="ex: Diallo"
                  value={nouveauCaissierNom}
                  onChange={e => setNouveauCaissierNom(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>Rôle de Sécurité</label>
              <select
                value={nouveauCaissierRole}
                onChange={e => setNouveauCaissierRole(e.target.value as any)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 13, background: '#fff', boxSizing: 'border-box' }}
              >
                <option value="caissier">Caissier Standard (Encaissement)</option>
                <option value="superviseur">Gérant / Superviseur (Remises, Clôtures Z)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy, #1C2B4A)', display: 'block', marginBottom: 4 }}>Code PIN Secret (4 à 6 chiffres) *</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••"
                value={nouveauCaissierPin}
                onChange={e => setNouveauCaissierPin(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #E8DDD2)', fontSize: 18, fontWeight: 800, textAlign: 'center', letterSpacing: '0.2em', boxSizing: 'border-box' }}
              />
            </div>

            {erreur && (
              <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: '#FEF2F2', color: '#B91C1C' }}>
                {erreur}
              </div>
            )}

            <button
              type="button"
              className="btn-npl btn-npl-md btn-npl-primary"
              onClick={creerCaissier}
              disabled={addingState}
              style={{ marginTop: 8 }}
            >
              <Plus size={16} />
              <span>{addingState ? 'Création...' : 'Créer le profil caissier'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
